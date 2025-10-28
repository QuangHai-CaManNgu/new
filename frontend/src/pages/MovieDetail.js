import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, authApi } from "../App";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Heart, Clock, Star, ArrowLeft, PlayCircle } from "lucide-react";
import ReviewList from "../components/ReviewList";

function MovieDetail({ user, onOpenAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovie();
    fetchReviews();
    if (user) {
      checkFavorite();
      addToWatchHistory();
    }
  }, [id, user]);

  const fetchMovie = async () => {
    try {
      const response = await axios.get(`${API}/movies/${id}`);
      setMovie(response.data);
    } catch (error) {
      console.error("Error fetching movie:", error);
      toast.error("Không thể tải thông tin phim");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await authApi.get("/favorites");
      const favoriteIds = response.data.map(m => m.id);
      setIsFavorite(favoriteIds.includes(id));
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const addToWatchHistory = async () => {
    try {
      await authApi.post("/watch-history", { movie_id: id, progress: 0 });
    } catch (error) {
      console.error("Error adding to watch history:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    try {
      if (isFavorite) {
        await authApi.delete(`/favorites/${id}`);
        setIsFavorite(false);
        toast.success("Đã xóa khỏi yêu thích");
      } else {
        await authApi.post("/favorites", { movie_id: id });
        setIsFavorite(true);
        toast.success("Đã thêm vào yêu thích");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const submitReview = async () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    if (!comment.trim()) {
      toast.error("Vui lòng nhập đánh giá");
      return;
    }

    try {
      await authApi.post(`/reviews/${id}`, {
        rating,
        comment: comment.trim()
      });
      toast.success("Đã gửi đánh giá");
      setComment("");
      setRating(5);
      fetchReviews();
      fetchMovie(); // Refresh to get updated rating
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Không thể gửi đánh giá");
      }
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    // Handle both youtube.com and youtu.be URLs
    const videoId = url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy phim</h2>
          <Button onClick={() => navigate('/')}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Background */}
      <div className="relative h-[60vh] overflow-hidden mb-8">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.poster_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27]/70 via-[#0a0e27]/90 to-[#0a0e27]" />
        </div>
        
        {/* Back Button */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 glass-effect border border-white/10 h-12 px-6 rounded-xl"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      {/* Movie Header */}
      <div className="max-w-7xl mx-auto px-4 -mt-40 relative z-20 mb-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="relative group">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full rounded-3xl shadow-2xl border-4 border-white/10 group-hover:border-purple-500/50 transition-all"
                data-testid="movie-poster"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Movie Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-effect rounded-3xl p-8 glow-effect">
              <h1 className="text-5xl sm:text-6xl font-black mb-6 gradient-text glow-text" data-testid="movie-title">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap gap-3 mb-6">
                {movie.genre.map((g) => (
                  <span key={g} className="category-badge text-sm">
                    {g}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-gray-300 mb-6">
                <div className="flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-xl border border-yellow-400/20">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-xl" data-testid="movie-rating">{movie.rating_avg.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({movie.rating_count})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">{movie.duration} phút</span>
                </div>
                <span className="px-4 py-2 bg-purple-500/20 rounded-xl text-sm font-bold border border-purple-500/30">{movie.year}</span>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed mb-6" data-testid="movie-description">
                {movie.description}
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={toggleFavorite}
                  className={`h-14 px-8 rounded-2xl font-bold transition-all ${
                    isFavorite 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-lg hover:shadow-red-500/50' 
                      : 'bg-white/10 hover:bg-white/20 border-2 border-white/20'
                  }`}
                  data-testid="favorite-btn"
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Section */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center gap-4 mb-6">
          <PlayCircle className="w-10 h-10 text-purple-400" />
          <h2 className="text-4xl font-black">Trailer</h2>
        </div>
        <div className="glass-effect rounded-3xl overflow-hidden glow-effect p-2" style={{ aspectRatio: '16/9' }}>
          <iframe
            width="100%"
            height="100%"
            src={movie.trailer_url}
            title={movie.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-2xl"
            data-testid="movie-trailer"
          ></iframe>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Đánh Giá</h2>
        
        {/* Review Form */}
        {user && (
          <Card className="glass-effect border-white/10 p-6 mb-8" data-testid="review-form">
            <h3 className="text-xl font-semibold mb-4">Viết đánh giá của bạn</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Đánh giá của bạn</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    data-testid={`rating-star-${star}`}
                  >
                    <Star
                      className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Chia sẻ suy nghĩ của bạn về bộ phim..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 mb-4 min-h-32"
              data-testid="review-textarea"
            />

            <Button onClick={submitReview} className="btn-primary" data-testid="submit-review-btn">
              Gửi đánh giá
            </Button>
          </Card>
        )}

        {/* Reviews List */}
        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
}

export default MovieDetail;
