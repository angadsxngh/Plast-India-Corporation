"""
Script to seed dealer/party data from Excel file into the database.
Handles rate limiting for free tier databases and ensures all data is seeded.
"""

import pandas as pd
import requests
import time
import sys
import os
from pathlib import Path
from typing import Dict, Optional, Tuple

# Configuration
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
DELAY_BETWEEN_REQUESTS = 0.5  # 500ms delay to avoid rate limiting
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

# Get the data directory path (parent of scripts directory)
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
EXCEL_FILE = DATA_DIR / "Dealer's Data.xlsx"


class PartySeeder:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.session = requests.Session()
        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        # If token provided, use Bearer auth (alternative to cookies)
        if self.token:
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
        # Ensure cookies are handled properly
        self.session.cookies.clear()
        self.stats = {
            'total': 0,
            'success': 0,
            'skipped': 0,
            'failed': 0,
            'errors': []
        }

    def login(self, email: str, password: str) -> bool:
        """Login to get authentication token (uses cookies for session)."""
        try:
            print(f"Logging in as {email}...")
            # Use session for login to maintain cookies
            response = self.session.post(
                f"{self.base_url}/login",
                json={"email": email, "password": password},
                allow_redirects=True
            )
            
            if response.status_code == 200:
                # Cookies are automatically stored in the session
                # Verify cookies were set
                cookies_received = list(self.session.cookies.keys())
                if len(cookies_received) > 0:
                    print(f"✓ Login successful! (using cookie-based authentication)")
                    print(f"  Cookies received: {cookies_received}")
                    # Verify accessToken is present and extract it for Bearer token
                    if 'accessToken' in cookies_received:
                        access_token_value = self.session.cookies.get('accessToken')
                        if access_token_value:
                            # Use Bearer token in header (more reliable than cookies for API requests)
                            self.session.headers.update({
                                'Authorization': f'Bearer {access_token_value}'
                            })
                            print(f"  ✓ accessToken extracted and set as Bearer token (length: {len(access_token_value)})")
                        else:
                            print(f"  ⚠ Warning: accessToken cookie is empty")
                    else:
                        print(f"  ⚠ Warning: accessToken cookie not found")
                else:
                    print("✓ Login successful, but no cookies received")
                    print("  Note: Backend may use different authentication method")
                return True
            else:
                error_msg = response.text
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', error_msg)
                except:
                    pass
                print(f"✗ Login failed: {response.status_code} - {error_msg}")
                return False
        except Exception as e:
            print(f"✗ Login error: {str(e)}")
            return False

    def create_party(self, name: str, contact_number: Optional[str] = None, retry_count: int = 0) -> Tuple[bool, str]:
        """Create a party with retry logic."""
        payload = {
            "name": str(name).strip()
        }
        
        # Add contact number only if provided
        if contact_number and str(contact_number).strip() and str(contact_number).strip().lower() != 'nan':
            payload["contactNumber"] = str(contact_number).strip()
        
        # Validate required fields
        if not payload["name"]:
            return False, "Name is required"
        
        try:
            # Debug: Check cookies before request
            if retry_count == 0:  # Only log on first attempt
                cookies_before = list(self.session.cookies.keys())
                if 'accessToken' in cookies_before:
                    # Verify cookie value exists
                    token_value = self.session.cookies.get('accessToken')
                    if not token_value or len(token_value) == 0:
                        return False, "accessToken cookie is empty - please login again"
            
            # Ensure cookies are sent with the request
            response = self.session.post(
                f"{self.base_url}/create-party",
                json=payload,
                timeout=10,
                allow_redirects=True
            )
            
            if response.status_code == 201:
                return True, "Created successfully"
            elif response.status_code == 400:
                error_data = response.json()
                error_msg = error_data.get('message', 'Unknown error')
                # Check if it's a duplicate error
                if 'already exists' in error_msg.lower():
                    return True, "Skipped (already exists)"
                return False, error_msg
            elif response.status_code == 401:
                # Check if we have cookies
                if len(self.session.cookies) == 0:
                    return False, "Authentication failed - no cookies in session. Please login again."
                else:
                    return False, f"Authentication failed - cookies present but invalid. Please login again. (Cookies: {list(self.session.cookies.keys())})"
            elif response.status_code == 429:
                # Rate limited - wait and retry
                if retry_count < MAX_RETRIES:
                    wait_time = RETRY_DELAY * (retry_count + 1)
                    print(f"  ⚠ Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    return self.create_party(name, contact_number, retry_count + 1)
                return False, "Rate limited - max retries exceeded"
            else:
                return False, f"HTTP {response.status_code}: {response.text[:100]}"
                
        except requests.exceptions.Timeout:
            if retry_count < MAX_RETRIES:
                wait_time = RETRY_DELAY * (retry_count + 1)
                print(f"  ⚠ Timeout. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                return self.create_party(name, contact_number, retry_count + 1)
            return False, "Request timeout - max retries exceeded"
        except Exception as e:
            return False, f"Error: {str(e)}"

    def read_excel_data(self) -> pd.DataFrame:
        """Read and parse the Excel file."""
        try:
            print(f"Reading Excel file: {EXCEL_FILE}")
            if not EXCEL_FILE.exists():
                raise FileNotFoundError(f"Excel file not found: {EXCEL_FILE}")
            
            # Read without header first to inspect all rows
            df_raw = pd.read_excel(EXCEL_FILE, header=None)
            
            # Find the row that contains "Particulars" (the actual header)
            header_row = None
            for idx, row in df_raw.iterrows():
                row_str = ' '.join([str(val).lower() for val in row.values if pd.notna(val)])
                # Look for "Particulars" specifically (this is the header row)
                if 'particular' in row_str:
                    header_row = idx
                    break
            
            if header_row is not None:
                # Read with header at the found row
                df = pd.read_excel(EXCEL_FILE, header=header_row)
                # Remove any rows before the header (if any were included)
                print(f"✓ Found header row at index {header_row + 1} (row with 'Particulars')")
            else:
                # Fallback: try to find header manually
                print("⚠ Could not find 'Particulars' header, trying alternative detection...")
                # Look for row with "Mobile No." or similar
                for idx, row in df_raw.iterrows():
                    row_str = ' '.join([str(val).lower() for val in row.values if pd.notna(val)])
                    if 'mobile' in row_str or 'phone' in row_str:
                        header_row = idx
                        break
                
                if header_row is not None:
                    df = pd.read_excel(EXCEL_FILE, header=header_row)
                    print(f"✓ Found header row at index {header_row + 1} (row with 'Mobile')")
                else:
                    # Last resort: read normally and clean up
                    print("⚠ Using default reading, will clean up manually...")
                    df = pd.read_excel(EXCEL_FILE)
                    # Remove empty rows at the start
                    while len(df) > 0 and df.iloc[0].isna().all():
                        df = df.iloc[1:].reset_index(drop=True)
            
            # Clean up: remove any rows where the name column is empty or NaN
            if len(df) > 0:
                # Get the first column (should be name/particulars)
                first_col = df.columns[0]
                df = df[df[first_col].notna()].reset_index(drop=True)
                # Remove rows where first column is empty string
                df = df[df[first_col].astype(str).str.strip() != ''].reset_index(drop=True)
            
            print(f"✓ Loaded {len(df)} rows from Excel file")
            print(f"Columns found: {list(df.columns)}")
            
            # Display first few rows for verification
            print("\nFirst 3 rows preview:")
            print(df.head(3).to_string())
            print()
            
            return df
        except Exception as e:
            print(f"✗ Error reading Excel file: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    def map_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Map Excel columns to expected fields (name, contactNumber)."""
        # Common column name variations
        name_columns = ['name', 'party name', 'dealer name', 'dealer', 'party', 
                       'company name', 'company', 'client name', 'client', 
                       'particulars', 'particular']
        contact_columns = ['contact', 'contact number', 'phone', 'mobile', 
                          'phone number', 'mobile number', 'number', 'contactNumber',
                          'mobile no.', 'mobile no', 'phone no.', 'phone no']
        
        # Find name column (case-insensitive)
        name_col = None
        for col in df.columns:
            if str(col).lower().strip() in name_columns:
                name_col = col
                break
        
        # Find contact column (case-insensitive)
        contact_col = None
        for col in df.columns:
            col_lower = str(col).lower().strip()
            if col_lower in contact_columns or any(contact_col in col_lower for contact_col in contact_columns):
                contact_col = col
                break
        
        if name_col is None:
            print("\n⚠ Warning: Could not find 'name' column automatically.")
            print(f"Available columns: {list(df.columns)}")
            print("Please ensure your Excel file has a column for party/dealer name.")
            name_col = df.columns[0] if len(df.columns) > 0 else None
        
        if contact_col is None:
            print("\n⚠ Warning: Could not find 'contact number' column automatically.")
            print(f"Available columns: {list(df.columns)}")
            print("Contact number is optional - parties can be created with name only.")
            contact_col = df.columns[1] if len(df.columns) > 1 else None
        
        if name_col is None:
            raise ValueError("Could not identify name column in Excel file")
        
        print(f"✓ Using column '{name_col}' for party name")
        if contact_col:
            print(f"✓ Using column '{contact_col}' for contact number (optional)")
        else:
            print("✓ Contact number column not found - will create parties with name only")
        
        # Create mapped dataframe
        if contact_col:
            mapped_df = pd.DataFrame({
                'name': df[name_col].astype(str),
                'contactNumber': df[contact_col].astype(str)
            })
        else:
            mapped_df = pd.DataFrame({
                'name': df[name_col].astype(str),
                'contactNumber': pd.Series([None] * len(df))
            })
        
        # Remove rows with empty name (contact number is optional)
        initial_count = len(mapped_df)
        mapped_df = mapped_df[
            (mapped_df['name'].str.strip() != '') & 
            (mapped_df['name'].str.strip() != 'nan')
        ]
        removed = initial_count - len(mapped_df)
        if removed > 0:
            print(f"⚠ Removed {removed} rows with empty name")
        
        return mapped_df

    def seed_data(self, df: pd.DataFrame):
        """Seed all parties from the dataframe."""
        self.stats['total'] = len(df)
        print(f"\n{'='*60}")
        print(f"Starting to seed {self.stats['total']} parties...")
        print(f"{'='*60}\n")
        
        for index, row in df.iterrows():
            name = row['name']
            contact = row.get('contactNumber', None)
            
            # Format display text
            contact_display = contact if contact and str(contact).strip() != 'nan' else 'No contact'
            print(f"[{index + 1}/{self.stats['total']}] Creating: {name} ({contact_display})", end=" ... ")
            
            success, message = self.create_party(name, contact if contact and str(contact).strip() != 'nan' else None)
            
            if success:
                if "already exists" in message:
                    print(f"⏭ {message}")
                    self.stats['skipped'] += 1
                else:
                    print(f"✓ {message}")
                    self.stats['success'] += 1
            else:
                print(f"✗ {message}")
                self.stats['failed'] += 1
                self.stats['errors'].append({
                    'row': index + 1,
                    'name': name,
                    'contact': contact,
                    'error': message
                })
            
            # Rate limiting delay
            if index < len(df) - 1:  # Don't delay after last item
                time.sleep(DELAY_BETWEEN_REQUESTS)
        
        self.print_summary()

    def print_summary(self):
        """Print seeding summary."""
        print(f"\n{'='*60}")
        print("SEEDING SUMMARY")
        print(f"{'='*60}")
        print(f"Total rows processed: {self.stats['total']}")
        print(f"✓ Successfully created: {self.stats['success']}")
        print(f"⏭ Skipped (already exists): {self.stats['skipped']}")
        print(f"✗ Failed: {self.stats['failed']}")
        print(f"{'='*60}")
        
        if self.stats['errors']:
            print("\nErrors encountered:")
            for error in self.stats['errors'][:10]:  # Show first 10 errors
                print(f"  Row {error['row']}: {error['name']} - {error['error']}")
            if len(self.stats['errors']) > 10:
                print(f"  ... and {len(self.stats['errors']) - 10} more errors")


def main():
    """Main function to run the seeding script."""
    print("="*60)
    print("PARTY/DEALER DATA SEEDING SCRIPT")
    print("="*60)
    print()
    
    # Check if Excel file exists
    if not EXCEL_FILE.exists():
        print(f"✗ Error: Excel file not found at {EXCEL_FILE}")
        print("Please ensure 'Dealer's Data.xlsx' is in the data/ directory")
        sys.exit(1)
    
    # Initialize seeder
    seeder = PartySeeder(BASE_URL)
    
    # Get authentication
    print("Authentication required to create parties.")
    print("You can either:")
    print("  1. Provide email and password to login")
    print("  2. Set API_TOKEN environment variable with a valid JWT token")
    print()
    
    token = os.getenv("API_TOKEN")
    if token:
        print("Using API_TOKEN from environment...")
        seeder.token = token
        seeder.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })
    else:
        email = input("Enter your email: ").strip()
        password = input("Enter your password: ").strip()
        
        if not seeder.login(email, password):
            print("\n✗ Authentication failed. Cannot proceed.")
            sys.exit(1)
    
    # Read and process Excel data
    df = seeder.read_excel_data()
    mapped_df = seeder.map_columns(df)
    
    # Confirm before proceeding
    print(f"\nReady to seed {len(mapped_df)} parties.")
    confirm = input("Do you want to proceed? (yes/no): ").strip().lower()
    if confirm not in ['yes', 'y']:
        print("Seeding cancelled.")
        sys.exit(0)
    
    # Seed the data
    seeder.seed_data(mapped_df)
    
    # Exit with appropriate code
    if seeder.stats['failed'] > 0:
        sys.exit(1)
    else:
        print("\n✓ Seeding completed successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()

