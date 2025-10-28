import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Film, User, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";

function Navbar({ user, onLogout, onOpenAuth }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            data-testid="nav-logo"
          >
            <div className="relative">
              <Film className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-2xl font-black gradient-text">CineHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  className="text-white hover:bg-white/10 hover:text-purple-400 transition-all h-12 px-6 rounded-xl"
                  data-testid="profile-btn"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  {user.name}
                </Button>
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="text-white hover:bg-red-500/10 hover:text-red-400 transition-all h-12 px-6 rounded-xl"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onOpenAuth('login')}
                  className="text-white hover:bg-white/10 transition-all h-12 px-6 rounded-xl"
                  data-testid="login-btn"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => onOpenAuth('register')}
                  className="btn-primary h-12"
                  data-testid="register-btn"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Đăng ký
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
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
          <div className="md:hidden py-4 border-t border-white/10 space-y-2">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-white hover:bg-white/10 justify-start h-12 rounded-xl"
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
                  className="w-full text-white hover:bg-white/10 justify-start h-12 rounded-xl"
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
                  className="w-full text-white hover:bg-white/10 justify-start h-12 rounded-xl"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full btn-primary justify-start h-12"
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
