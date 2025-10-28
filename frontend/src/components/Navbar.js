import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Film, User, LogOut, Search } from "lucide-react";
import { useState } from "react";

function Navbar({ user, onLogout, onOpenAuth }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-bold gradient-text"
            data-testid="nav-logo"
          >
            <Film className="w-8 h-8" />
            <span>CineHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  className="text-white hover:bg-white/10"
                  data-testid="profile-btn"
                >
                  <User className="w-4 h-4 mr-2" />
                  {user.name}
                </Button>
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="text-white hover:bg-white/10"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onOpenAuth('login')}
                  className="text-white hover:bg-white/10"
                  data-testid="login-btn"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => onOpenAuth('register')}
                  className="btn-primary"
                  data-testid="register-btn"
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-white hover:bg-white/10 justify-start mb-2"
                >
                  <User className="w-4 h-4 mr-2" />
                  {user.name}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-white hover:bg-white/10 justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-white hover:bg-white/10 justify-start mb-2"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full btn-primary justify-start"
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
