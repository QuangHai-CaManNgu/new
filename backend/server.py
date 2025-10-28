from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== Models ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Movie(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    genre: List[str]
    year: int
    duration: int  # minutes
    poster_url: str
    trailer_url: str  # YouTube/Vimeo URL
    rating_avg: float = 0.0
    rating_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    movie_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WatchHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    movie_id: str
    watched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    progress: int = 0  # percentage

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    movie_id: str
    rating: int  # 1-5
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    rating: int
    comment: str

class FavoriteCreate(BaseModel):
    movie_id: str

class WatchHistoryCreate(BaseModel):
    movie_id: str
    progress: int = 0

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== Auth Routes ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Convert to User model
    user_doc.pop('password')
    user_doc.pop('_id', None)
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**current_user)

# ==================== Movie Routes ====================

@api_router.get("/movies", response_model=List[Movie])
async def get_movies(
    search: Optional[str] = None,
    genre: Optional[str] = None,
    limit: int = 100
):
    query = {}
    
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    if genre:
        query['genre'] = {'$in': [genre]}
    
    movies = await db.movies.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    for movie in movies:
        if isinstance(movie['created_at'], str):
            movie['created_at'] = datetime.fromisoformat(movie['created_at'])
    
    return movies

@api_router.get("/movies/{movie_id}", response_model=Movie)
async def get_movie(movie_id: str):
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if isinstance(movie['created_at'], str):
        movie['created_at'] = datetime.fromisoformat(movie['created_at'])
    
    return Movie(**movie)

@api_router.get("/genres")
async def get_genres():
    # Get all unique genres
    movies = await db.movies.find({}, {"genre": 1, "_id": 0}).to_list(1000)
    genres = set()
    for movie in movies:
        genres.update(movie.get('genre', []))
    return {"genres": sorted(list(genres))}

# ==================== Favorites Routes ====================

@api_router.get("/favorites", response_model=List[Movie])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    # Get user's favorites
    favorites = await db.favorites.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    movie_ids = [fav['movie_id'] for fav in favorites]
    
    if not movie_ids:
        return []
    
    # Get movies
    movies = await db.movies.find({"id": {"$in": movie_ids}}, {"_id": 0}).to_list(1000)
    
    for movie in movies:
        if isinstance(movie['created_at'], str):
            movie['created_at'] = datetime.fromisoformat(movie['created_at'])
    
    return movies

@api_router.post("/favorites")
async def add_favorite(
    favorite_data: FavoriteCreate,
    current_user: dict = Depends(get_current_user)
):
    # Check if movie exists
    movie = await db.movies.find_one({"id": favorite_data.movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if already in favorites
    existing = await db.favorites.find_one({
        "user_id": current_user['id'],
        "movie_id": favorite_data.movie_id
    })
    if existing:
        return {"message": "Already in favorites"}
    
    # Add to favorites
    favorite = Favorite(
        user_id=current_user['id'],
        movie_id=favorite_data.movie_id
    )
    
    favorite_dict = favorite.model_dump()
    favorite_dict['created_at'] = favorite_dict['created_at'].isoformat()
    
    await db.favorites.insert_one(favorite_dict)
    
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{movie_id}")
async def remove_favorite(
    movie_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = await db.favorites.delete_one({
        "user_id": current_user['id'],
        "movie_id": movie_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Removed from favorites"}

# ==================== Watch History Routes ====================

@api_router.get("/watch-history", response_model=List[Movie])
async def get_watch_history(current_user: dict = Depends(get_current_user)):
    # Get user's watch history
    history = await db.watch_history.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("watched_at", -1).limit(50).to_list(50)
    
    movie_ids = [h['movie_id'] for h in history]
    
    if not movie_ids:
        return []
    
    # Get movies
    movies = await db.movies.find({"id": {"$in": movie_ids}}, {"_id": 0}).to_list(1000)
    
    for movie in movies:
        if isinstance(movie['created_at'], str):
            movie['created_at'] = datetime.fromisoformat(movie['created_at'])
    
    return movies

@api_router.post("/watch-history")
async def add_watch_history(
    history_data: WatchHistoryCreate,
    current_user: dict = Depends(get_current_user)
):
    # Check if movie exists
    movie = await db.movies.find_one({"id": history_data.movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if already exists and update
    existing = await db.watch_history.find_one({
        "user_id": current_user['id'],
        "movie_id": history_data.movie_id
    })
    
    if existing:
        await db.watch_history.update_one(
            {"user_id": current_user['id'], "movie_id": history_data.movie_id},
            {"$set": {
                "watched_at": datetime.now(timezone.utc).isoformat(),
                "progress": history_data.progress
            }}
        )
    else:
        history = WatchHistory(
            user_id=current_user['id'],
            movie_id=history_data.movie_id,
            progress=history_data.progress
        )
        
        history_dict = history.model_dump()
        history_dict['watched_at'] = history_dict['watched_at'].isoformat()
        
        await db.watch_history.insert_one(history_dict)
    
    return {"message": "Watch history updated"}

# ==================== Reviews Routes ====================

@api_router.get("/reviews/{movie_id}", response_model=List[Review])
async def get_reviews(movie_id: str):
    reviews = await db.reviews.find(
        {"movie_id": movie_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for review in reviews:
        if isinstance(review['created_at'], str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    
    return reviews

@api_router.post("/reviews/{movie_id}")
async def create_review(
    movie_id: str,
    review_data: ReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    # Check if movie exists
    movie = await db.movies.find_one({"id": movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Validate rating
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if user already reviewed
    existing = await db.reviews.find_one({
        "user_id": current_user['id'],
        "movie_id": movie_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this movie")
    
    # Create review
    review = Review(
        user_id=current_user['id'],
        user_name=current_user['name'],
        movie_id=movie_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Update movie rating
    all_reviews = await db.reviews.find({"movie_id": movie_id}).to_list(1000)
    avg_rating = sum(r['rating'] for r in all_reviews) / len(all_reviews)
    
    await db.movies.update_one(
        {"id": movie_id},
        {"$set": {"rating_avg": round(avg_rating, 1), "rating_count": len(all_reviews)}}
    )
    
    return {"message": "Review created successfully"}

# ==================== Initialize Mock Data ====================

@api_router.post("/init-data")
async def init_mock_data():
    # Check if data already exists
    count = await db.movies.count_documents({})
    if count > 0:
        return {"message": "Data already initialized"}
    
    mock_movies = [
        {
            "id": str(uuid.uuid4()),
            "title": "The Shawshank Redemption",
            "description": "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
            "genre": ["Drama"],
            "year": 1994,
            "duration": 142,
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
            "trailer_url": "https://www.youtube.com/embed/NmzuHjWmXOc",
            "rating_avg": 4.8,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Dark Knight",
            "description": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.",
            "genre": ["Action", "Crime", "Drama"],
            "year": 2008,
            "duration": 152,
            "poster_url": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500",
            "trailer_url": "https://www.youtube.com/embed/EXeTwQWrcwY",
            "rating_avg": 4.7,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Inception",
            "description": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
            "genre": ["Action", "Sci-Fi", "Thriller"],
            "year": 2010,
            "duration": 148,
            "poster_url": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500",
            "trailer_url": "https://www.youtube.com/embed/YoHD9XEInc0",
            "rating_avg": 4.6,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Pulp Fiction",
            "description": "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
            "genre": ["Crime", "Drama"],
            "year": 1994,
            "duration": 154,
            "poster_url": "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=500",
            "trailer_url": "https://www.youtube.com/embed/s7EdQ4FqbhY",
            "rating_avg": 4.5,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Interstellar",
            "description": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            "genre": ["Adventure", "Drama", "Sci-Fi"],
            "year": 2014,
            "duration": 169,
            "poster_url": "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=500",
            "trailer_url": "https://www.youtube.com/embed/zSWdZVtXT7E",
            "rating_avg": 4.6,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Matrix",
            "description": "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
            "genre": ["Action", "Sci-Fi"],
            "year": 1999,
            "duration": 136,
            "poster_url": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500",
            "trailer_url": "https://www.youtube.com/embed/vKQi3bBA1y8",
            "rating_avg": 4.5,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Forrest Gump",
            "description": "The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.",
            "genre": ["Drama", "Romance"],
            "year": 1994,
            "duration": 142,
            "poster_url": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500",
            "trailer_url": "https://www.youtube.com/embed/bLvqoHBptjg",
            "rating_avg": 4.4,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Godfather",
            "description": "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
            "genre": ["Crime", "Drama"],
            "year": 1972,
            "duration": 175,
            "poster_url": "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=500",
            "trailer_url": "https://www.youtube.com/embed/sY1S34973zA",
            "rating_avg": 4.9,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Fight Club",
            "description": "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
            "genre": ["Drama"],
            "year": 1999,
            "duration": 139,
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500",
            "trailer_url": "https://www.youtube.com/embed/qtRKdVHc-cE",
            "rating_avg": 4.5,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Gladiator",
            "description": "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
            "genre": ["Action", "Adventure", "Drama"],
            "year": 2000,
            "duration": 155,
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=500",
            "trailer_url": "https://www.youtube.com/embed/owK1qxDselE",
            "rating_avg": 4.4,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Avengers: Endgame",
            "description": "After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos' actions and restore balance.",
            "genre": ["Action", "Adventure", "Sci-Fi"],
            "year": 2019,
            "duration": 181,
            "poster_url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500",
            "trailer_url": "https://www.youtube.com/embed/TcMBFSGVi1c",
            "rating_avg": 4.5,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Lion King",
            "description": "Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.",
            "genre": ["Animation", "Adventure", "Drama"],
            "year": 1994,
            "duration": 88,
            "poster_url": "https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=500",
            "trailer_url": "https://www.youtube.com/embed/lFzVJEksoDY",
            "rating_avg": 4.6,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Parasite",
            "description": "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
            "genre": ["Drama", "Thriller"],
            "year": 2019,
            "duration": 132,
            "poster_url": "https://images.unsplash.com/photo-1574267432644-f71db5c2e8f7?w=500",
            "trailer_url": "https://www.youtube.com/embed/5xH0HfJHsaY",
            "rating_avg": 4.7,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Joker",
            "description": "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral.",
            "genre": ["Crime", "Drama", "Thriller"],
            "year": 2019,
            "duration": 122,
            "poster_url": "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=500",
            "trailer_url": "https://www.youtube.com/embed/zAGVQLHvwOY",
            "rating_avg": 4.4,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Titanic",
            "description": "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
            "genre": ["Drama", "Romance"],
            "year": 1997,
            "duration": 194,
            "poster_url": "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=500",
            "trailer_url": "https://www.youtube.com/embed/kVrqfYjkTdQ",
            "rating_avg": 4.3,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Toy Story",
            "description": "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room.",
            "genre": ["Animation", "Adventure", "Comedy"],
            "year": 1995,
            "duration": 81,
            "poster_url": "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=500",
            "trailer_url": "https://www.youtube.com/embed/v-PjgYDrg70",
            "rating_avg": 4.5,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Spider-Man: No Way Home",
            "description": "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
            "genre": ["Action", "Adventure", "Sci-Fi"],
            "year": 2021,
            "duration": 148,
            "poster_url": "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=500",
            "trailer_url": "https://www.youtube.com/embed/JfVOs4VSpmA",
            "rating_avg": 4.6,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Lord of the Rings",
            "description": "A meek Hobbit and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth.",
            "genre": ["Adventure", "Fantasy"],
            "year": 2001,
            "duration": 178,
            "poster_url": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=500",
            "trailer_url": "https://www.youtube.com/embed/V75dMMIW2B4",
            "rating_avg": 4.8,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Jurassic Park",
            "description": "A pragmatic paleontologist touring an almost complete theme park on an island is tasked with protecting a couple of kids after a power failure.",
            "genre": ["Adventure", "Sci-Fi", "Thriller"],
            "year": 1993,
            "duration": 127,
            "poster_url": "https://images.unsplash.com/photo-1611447883169-2c0a36e5ee71?w=500",
            "trailer_url": "https://www.youtube.com/embed/lc0UehYemOA",
            "rating_avg": 4.4,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Harry Potter and the Sorcerer's Stone",
            "description": "An orphaned boy enrolls in a school of wizardry, where he learns the truth about himself, his family and the terrible evil haunting the magical world.",
            "genre": ["Adventure", "Fantasy"],
            "year": 2001,
            "duration": 152,
            "poster_url": "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=500",
            "trailer_url": "https://www.youtube.com/embed/VyHV0BRtdxo",
            "rating_avg": 4.5,
            "rating_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.movies.insert_many(mock_movies)
    
    return {"message": f"Initialized {len(mock_movies)} movies"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
