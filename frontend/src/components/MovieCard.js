import { Star, Clock } from "lucide-react";

function MovieCard({ movie, onClick }) {
  return (
    <div
      className="movie-card glass-effect group cursor-pointer"
      onClick={onClick}
      data-testid={`movie-card-${movie.id}`}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-80 object-cover transition-transform group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{movie.rating_avg.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{movie.duration}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate" data-testid="movie-card-title">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{movie.year}</span>
          <span>{movie.genre[0]}</span>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
