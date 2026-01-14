import * as React from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Key, Phone, House, Info } from "lucide-react";
import logo from "@/src/assets/PIC.png";
import { useNavigate } from "react-router-dom";


function Header() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { name: "About Us", href: "/#about", icon: <Info className="mr-2 h-4 w-4" /> },
    { name: "Contact", href: "/#contact", icon: <Phone className="mr-2 h-4 w-4" /> },
    { name: "Login", href: "/login", icon: <Key className="mr-2 h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur bg-yellow-300 scroll-smooth">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Company Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="logo" className="w-16" />
            <h1 className="hidden text-base font-semibold md:block md:text-xl tracking-tight">
              Plast India Corporation
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex gap-3 lg:gap-4">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Button
                    variant="outline"
                    className="bg-blue-400 text-white hover:bg-blue-500 hover:text-white"
                    asChild
                  >
                    <a href={link.href}>{link.icon} {link.name}</a>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="border-t py-4 md:hidden">
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Button
                    variant="outline"
                    className="w-full bg-blue-400 text-white hover:bg-blue-500 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                    asChild
                  >
                    <a href={link.href}>{link.icon} {link.name}</a>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
