import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import MovieCard from "../components/MovieCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Film, Sparkles, Flame, TrendingUp, Star } from "lucide-react";

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

  // Get featured movies (top rated)
  const featuredMovies = [...movies].sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 1);
  const featuredMovie = featuredMovies[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Featured Movie */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>
        
        {/* Background Image */}
        {featuredMovie && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${featuredMovie.poster_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27]/95 via-[#0a0e27]/90 to-[#0a0e27]" />
          </div>
        )}
        
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8 fade-in-up">
            <div className="relative">
              <Film className="w-20 h-20 text-purple-400 glow-effect" />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6 gradient-text glow-text fade-in-up stagger-1">
            Thế Giới Điện Ảnh
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto font-light fade-in-up stagger-2">
            Trải nghiệm <span className="text-purple-400 font-semibold">điện ảnh đỉnh cao</span> với
          </p>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto fade-in-up stagger-3">
            Hàng ngàn bộ phim từ Hollywood đến Châu Á. Xem ngay, đánh giá và chia sẻ cảm nhận của bạn.
          </p>
          
          {featuredMovie && (
            <div className="glass-effect rounded-3xl p-6 mb-10 max-w-2xl mx-auto fade-in-up stagger-4">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Phim Nổi Bật</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{featuredMovie.title}</h3>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{featuredMovie.rating_avg.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{featuredMovie.year}</span>
                <span>•</span>
                <span>{featuredMovie.genre[0]}</span>
              </div>
            </div>
          )}
          
          {!user && (
            <Button 
              onClick={() => onOpenAuth('register')}
              className="btn-primary text-lg px-10 py-7 text-lg fade-in-up stagger-4"
              data-testid="hero-get-started-btn"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Bắt Đầu Khám Phá
            </Button>
          )}
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-purple-400 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-purple-400 rounded-full pulse-animation"></div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="glass-effect rounded-3xl p-8 mb-12 glow-effect">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm phim yêu thích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 h-14 rounded-2xl text-lg focus:border-purple-400"
                data-testid="search-input"
              />
            </div>
            
            <Select value={selectedGenre} onValueChange={handleGenreChange}>
              <SelectTrigger 
                className="w-full md:w-56 bg-white/5 border-white/10 text-white h-14 rounded-2xl text-lg"
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
              className="btn-primary h-14 px-8 text-lg"
              data-testid="search-btn"
            >
              <Search className="w-5 h-5 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Movies Grid */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <TrendingUp className="w-10 h-10 text-purple-400" />
            <div>
              <h2 className="text-4xl font-black">
                {selectedGenre && selectedGenre !== "all" ? `Phim ${selectedGenre}` : "Tất Cả Phim"}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{movies.length} bộ phim</p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-32">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Đang tải phim...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-32 text-gray-400" data-testid="no-movies-message">
              <Film className="w-20 h-20 mx-auto mb-6 opacity-30" />
              <p className="text-2xl font-semibold">Không tìm thấy phim nào</p>
              <p className="text-gray-500 mt-2">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {movies.map((movie, index) => (
                <div key={movie.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <MovieCard 
                    movie={movie} 
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
