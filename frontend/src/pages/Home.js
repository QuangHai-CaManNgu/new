import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import MovieCard from "../components/MovieCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Film, Sparkles } from "lucide-react";

function Home({ user, onOpenAuth }) {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGenres();
    fetchMovies();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`${API}/genres`);
      setGenres(response.data.genres);
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  };

  const fetchMovies = async (search = "", genre = "") => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (genre && genre !== "all") params.genre = genre;
      
      const response = await axios.get(`${API}/movies`, { params });
      setMovies(response.data);
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchMovies(searchQuery, selectedGenre);
  };

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    fetchMovies(searchQuery, genre);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,26,0.95) 0%, rgba(26,26,46,0.9) 50%, rgba(22,33,62,0.95) 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(8px)'
            }}
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Film className="w-16 h-16 text-purple-400" />
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 gradient-text">
            Khám Phá Thế Giới Điện Ảnh
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Hàng nghìn bộ phim đỉnh cao đang chờ bạn khám phá. Xem ngay, đánh giá và chia sẻ cảm nhận của bạn.
          </p>
          
          {!user && (
            <Button 
              onClick={() => onOpenAuth('register')}
              className="btn-primary text-lg px-8 py-6"
              data-testid="hero-get-started-btn"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Bắt Đầu Ngay
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 h-12"
                data-testid="search-input"
              />
            </div>
            
            <Select value={selectedGenre} onValueChange={handleGenreChange}>
              <SelectTrigger 
                className="w-full md:w-48 bg-white/5 border-white/10 text-white h-12"
                data-testid="genre-filter"
              >
                <SelectValue placeholder="Thể loại" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">Tất cả</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch}
              className="btn-primary h-12 px-6"
              data-testid="search-btn"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Movies Grid */}
        <div>
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <Film className="w-8 h-8 mr-3 text-purple-400" />
            {selectedGenre && selectedGenre !== "all" ? `Phim ${selectedGenre}` : "Tất Cả Phim"}
          </h2>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-20 text-gray-400" data-testid="no-movies-message">
              <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Không tìm thấy phim nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  onClick={() => navigate(`/movie/${movie.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
