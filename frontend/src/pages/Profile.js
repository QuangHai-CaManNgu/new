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
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* User Info */}
        <div className="glass-effect rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="profile-name">{user.name}</h1>
              <p className="text-gray-400" data-testid="profile-email">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="glass-effect border-white/10 mb-8">
            <TabsTrigger 
              value="favorites" 
              className="data-[state=active]:bg-purple-500"
              data-testid="favorites-tab"
            >
              <Heart className="w-4 h-4 mr-2" />
              Yêu thích ({favorites.length})
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-purple-500"
              data-testid="history-tab"
            >
              <Clock className="w-4 h-4 mr-2" />
              Lịch sử xem ({watchHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <div className="text-center py-20 text-gray-400" data-testid="no-favorites-message">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Chưa có phim yêu thích</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {favorites.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {watchHistory.length === 0 ? (
              <div className="text-center py-20 text-gray-400" data-testid="no-history-message">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Chưa có lịch sử xem</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {watchHistory.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  />
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
