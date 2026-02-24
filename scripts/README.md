# Party/Dealer Data Seeding Script

This script reads dealer/party data from an Excel file and seeds it into the database via the API.

## Prerequisites

1. Python 3.8 or higher
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Setup

1. Ensure your Excel file `Dealer's Data.xlsx` is in the `data/` directory
2. The Excel file should have columns for:
   - Party/Dealer Name (common column names: name, party name, dealer name, company name, etc.)
   - Contact Number (common column names: contact, contact number, phone, mobile, etc.)

## Usage

### Option 1: Run with interactive login
```bash
python scripts/parties.py
```

The script will prompt you for:
- Email address
- Password

### Option 2: Use environment variables
```bash
# Set API base URL (optional, defaults to http://localhost:3000)
export API_BASE_URL=http://localhost:3000

# Set JWT token (optional, if you have one)
export API_TOKEN=your_jwt_token_here

python scripts/parties.py
```

## Features

- **Automatic column detection**: The script automatically detects name and contact number columns
- **Rate limiting protection**: Includes 500ms delay between requests to avoid overwhelming free tier databases
- **Retry logic**: Automatically retries failed requests up to 3 times
- **Duplicate handling**: Skips parties that already exist (no errors)
- **Progress tracking**: Shows real-time progress and summary statistics
- **Error reporting**: Lists all errors encountered during seeding

## Rate Limiting

The script includes:
- 500ms delay between each request
- Automatic retry with exponential backoff for rate limit errors (429)
- Timeout handling with retries

## Output

The script provides:
- Real-time progress updates
- Success/skip/failure counts
- Detailed error messages for failed entries
- Summary statistics at the end

## Example Output

```
============================================================
PARTY/DEALER DATA SEEDING SCRIPT
============================================================

Reading Excel file: data/Dealer's Data.xlsx
✓ Loaded 74 rows from Excel file
Columns found: ['Dealer Name', 'Contact Number']

✓ Using column 'Dealer Name' for party name
✓ Using column 'Contact Number' for contact number

[1/74] Creating: ABC Company (1234567890) ... ✓ Created successfully
[2/74] Creating: XYZ Corp (9876543210) ... ⏭ Skipped (already exists)
...

============================================================
SEEDING SUMMARY
============================================================
Total rows processed: 74
✓ Successfully created: 70
⏭ Skipped (already exists): 2
✗ Failed: 2
============================================================
```

