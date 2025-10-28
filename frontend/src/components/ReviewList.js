import { Card } from "./ui/card";
import { Star, User } from "lucide-react";

function ReviewList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400" data-testid="no-reviews-message">
        <p className="text-lg">Chưa có đánh giá nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card 
          key={review.id} 
          className="glass-effect border-white/10 p-6"
          data-testid={`review-${review.id}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" data-testid="review-user-name">{review.user_name}</h4>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-gray-300" data-testid="review-comment">{review.comment}</p>
              
              <p className="text-sm text-gray-500 mt-2">
                {new Date(review.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default ReviewList;
