import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

function AuthModal({ open, onClose, mode, onModeChange, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      toast.success(mode === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
      onSuccess(response.data);
      setFormData({ email: "", password: "", name: "" });
    } catch (error) {
      const message = error.response?.data?.detail || 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/10 text-white rounded-3xl glow-effect max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black gradient-text text-center mb-2">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </DialogTitle>
          <p className="text-gray-400 text-center text-sm">
            {mode === 'login' ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình điện ảnh'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4" data-testid="auth-form">
          {mode === 'register' && (
            <div>
              <Label htmlFor="name" className="text-gray-300 font-semibold">Họ và tên</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={mode === 'register'}
                className="bg-white/5 border-white/10 text-white mt-2 h-12 rounded-xl focus:border-purple-400"
                data-testid="name-input"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-300 font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white mt-2 h-12 rounded-xl focus:border-purple-400"
              data-testid="email-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300 font-semibold">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white mt-2 h-12 rounded-xl focus:border-purple-400"
              data-testid="password-input"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full btn-primary h-12 text-lg mt-6" 
            disabled={loading}
            data-testid="auth-submit-btn"
          >
            {loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký')}
          </Button>

          <div className="text-center text-sm text-gray-400 pt-4">
            {mode === 'login' ? (
              <>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => onModeChange('register')}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                  data-testid="switch-to-register"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => onModeChange('login')}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                  data-testid="switch-to-login"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
