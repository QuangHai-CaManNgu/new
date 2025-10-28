import { Star, Clock, Play } from "lucide-react";

function MovieCard({ movie, onClick }) {
  return (
    <div
      className="movie-card group cursor-pointer"
      onClick={onClick}
      data-testid={`movie-card-${movie.id}`}
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-96 object-cover"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-center justify-center">
          <div className="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-400">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/30">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        </div>
        
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-sm">{movie.rating_avg.toFixed(1)}</span>
        </div>
        
        {/* Year Badge */}
        <div className="absolute top-3 left-3 bg-purple-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-semibold">
          {movie.year}
        </div>
      </div>
      
      <div className="p-5 space-y-3">
        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors" data-testid="movie-card-title">
          {movie.title}
        </h3>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{movie.duration}m</span>
          </div>
          <span className="category-badge text-xs">{movie.genre[0]}</span>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
