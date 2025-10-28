import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import MovieCard from "../components/MovieCard";
import { Heart, Clock, User } from "lucide-react";
import { toast } from "sonner";

function Profile({ user }) {
  const [favorites, setFavorites] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
    fetchWatchHistory();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await authApi.get("/favorites");
      setFavorites(response.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Không thể tải danh sách yêu thích");
    }
  };

  const fetchWatchHistory = async () => {
    try {
      const response = await authApi.get("/watch-history");
      setWatchHistory(response.data);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      toast.error("Không thể tải lịch sử xem");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* User Info */}
        <div className="glass-effect rounded-3xl p-8 mb-10 glow-effect">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black gradient-text mb-2" data-testid="profile-name">{user.name}</h1>
              <p className="text-gray-400 text-lg" data-testid="profile-email">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="glass-effect border-white/10 mb-10 p-2 h-auto rounded-2xl">
            <TabsTrigger 
              value="favorites" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 rounded-xl h-12 px-6 text-base"
              data-testid="favorites-tab"
            >
              <Heart className="w-5 h-5 mr-2" />
              Yêu thích <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">({favorites.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 rounded-xl h-12 px-6 text-base"
              data-testid="history-tab"
            >
              <Clock className="w-5 h-5 mr-2" />
              Lịch sử xem <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">({watchHistory.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <div className="text-center py-32 text-gray-400" data-testid="no-favorites-message">
                <div className="glass-effect rounded-3xl p-12 max-w-md mx-auto">
                  <Heart className="w-20 h-20 mx-auto mb-6 opacity-30" />
                  <p className="text-2xl font-bold mb-2">Chưa có phim yêu thích</p>
                  <p className="text-gray-500">Bắt đầu thêm phim vào danh sách của bạn</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {favorites.map((movie, index) => (
                  <div key={movie.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <MovieCard
                      movie={movie}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {watchHistory.length === 0 ? (
              <div className="text-center py-32 text-gray-400" data-testid="no-history-message">
                <div className="glass-effect rounded-3xl p-12 max-w-md mx-auto">
                  <Clock className="w-20 h-20 mx-auto mb-6 opacity-30" />
                  <p className="text-2xl font-bold mb-2">Chưa có lịch sử xem</p>
                  <p className="text-gray-500">Khám phá và xem phim ngay</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {watchHistory.map((movie, index) => (
                  <div key={movie.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <MovieCard
                      movie={movie}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Profile;
