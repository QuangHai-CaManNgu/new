import { Card } from "./ui/card";
import { Star, User } from "lucide-react";

function ReviewList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400" data-testid="no-reviews-message">
        <div className="glass-effect rounded-3xl p-12 max-w-md mx-auto">
          <Star className="w-16 h-16 mx-auto mb-4 opacity-30 text-yellow-400" />
          <p className="text-xl font-semibold">Chưa có đánh giá nào</p>
          <p className="text-gray-500 text-sm mt-2">Hãy là người đầu tiên đánh giá bộ phim này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card 
          key={review.id} 
          className="glass-effect border-white/10 p-6 rounded-3xl hover:border-purple-500/30 transition-all"
          data-testid={`review-${review.id}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
              <User className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg" data-testid="review-user-name">{review.user_name}</h4>
                <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-gray-300 leading-relaxed" data-testid="review-comment">{review.comment}</p>
              
              <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(review.created_at).toLocaleDateString('vi-VN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default ReviewList;
