import requests
import sys
import json
from datetime import datetime

class MovieWebsiteAPITester:
    def __init__(self, base_url="https://screenhub-130.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_movie_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_init_data(self):
        """Initialize mock data"""
        print("\n🔧 Initializing mock data...")
        result = self.run_test(
            "Initialize Mock Data",
            "POST",
            "/init-data",
            200
        )
        return result is not None

    def test_get_movies(self):
        """Test getting movies list"""
        print("\n🎬 Testing Movies API...")
        
        # Test basic movie list
        movies = self.run_test(
            "Get Movies List",
            "GET",
            "/movies",
            200
        )
        
        if movies and len(movies) > 0:
            self.test_movie_id = movies[0]['id']
            self.log_test("Movies Data Available", True, f"Found {len(movies)} movies")
            
            # Test search functionality
            search_result = self.run_test(
                "Search Movies",
                "GET",
                "/movies?search=Dark",
                200
            )
            
            # Test genre filter
            genre_result = self.run_test(
                "Filter by Genre",
                "GET",
                "/movies?genre=Action",
                200
            )
            
            return True
        else:
            self.log_test("Movies Data Available", False, "No movies found")
            return False

    def test_get_genres(self):
        """Test getting genres"""
        genres = self.run_test(
            "Get Genres",
            "GET",
            "/genres",
            200
        )
        
        if genres and 'genres' in genres:
            self.log_test("Genres Available", True, f"Found {len(genres['genres'])} genres")
            return True
        return False

    def test_get_movie_detail(self):
        """Test getting movie details"""
        if not self.test_movie_id:
            self.log_test("Get Movie Detail", False, "No movie ID available")
            return False
            
        movie = self.run_test(
            "Get Movie Detail",
            "GET",
            f"/movies/{self.test_movie_id}",
            200
        )
        
        return movie is not None

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing Authentication...")
        
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        test_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test User"
        }
        
        result = self.run_test(
            "User Registration",
            "POST",
            "/auth/register",
            200,
            data=test_data
        )
        
        if result and 'access_token' in result:
            self.token = result['access_token']
            self.user_id = result['user']['id']
            self.log_test("Registration Token Received", True, "Token stored")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing account"""
        # First register a user
        test_email = f"login_test_{datetime.now().strftime('%H%M%S')}@example.com"
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Login Test User"
        }
        
        # Register
        register_result = self.run_test(
            "Register for Login Test",
            "POST",
            "/auth/register",
            200,
            data=register_data
        )
        
        if not register_result:
            return False
        
        # Now test login
        login_data = {
            "email": test_email,
            "password": "TestPass123!"
        }
        
        login_result = self.run_test(
            "User Login",
            "POST",
            "/auth/login",
            200,
            data=login_data
        )
        
        return login_result is not None

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            self.log_test("Get Current User", False, "No auth token available")
            return False
            
        user = self.run_test(
            "Get Current User",
            "GET",
            "/auth/me",
            200
        )
        
        return user is not None

    def test_favorites(self):
        """Test favorites functionality"""
        print("\n❤️ Testing Favorites...")
        
        if not self.token or not self.test_movie_id:
            self.log_test("Favorites Test", False, "Missing auth token or movie ID")
            return False
        
        # Add to favorites
        add_result = self.run_test(
            "Add to Favorites",
            "POST",
            "/favorites",
            200,
            data={"movie_id": self.test_movie_id}
        )
        
        if not add_result:
            return False
        
        # Get favorites list
        favorites = self.run_test(
            "Get Favorites List",
            "GET",
            "/favorites",
            200
        )
        
        if not favorites:
            return False
        
        # Remove from favorites
        remove_result = self.run_test(
            "Remove from Favorites",
            "DELETE",
            f"/favorites/{self.test_movie_id}",
            200
        )
        
        return remove_result is not None

    def test_watch_history(self):
        """Test watch history functionality"""
        print("\n📺 Testing Watch History...")
        
        if not self.token or not self.test_movie_id:
            self.log_test("Watch History Test", False, "Missing auth token or movie ID")
            return False
        
        # Add to watch history
        add_result = self.run_test(
            "Add to Watch History",
            "POST",
            "/watch-history",
            200,
            data={"movie_id": self.test_movie_id, "progress": 50}
        )
        
        if not add_result:
            return False
        
        # Get watch history
        history = self.run_test(
            "Get Watch History",
            "GET",
            "/watch-history",
            200
        )
        
        return history is not None

    def test_reviews(self):
        """Test reviews functionality"""
        print("\n⭐ Testing Reviews...")
        
        if not self.token or not self.test_movie_id:
            self.log_test("Reviews Test", False, "Missing auth token or movie ID")
            return False
        
        # Create review
        review_data = {
            "rating": 5,
            "comment": "Great movie! Highly recommended."
        }
        
        create_result = self.run_test(
            "Create Review",
            "POST",
            f"/reviews/{self.test_movie_id}",
            200,
            data=review_data
        )
        
        if not create_result:
            return False
        
        # Get reviews for movie
        reviews = self.run_test(
            "Get Movie Reviews",
            "GET",
            f"/reviews/{self.test_movie_id}",
            200
        )
        
        return reviews is not None

    def test_error_cases(self):
        """Test error handling"""
        print("\n🚫 Testing Error Cases...")
        
        # Test invalid movie ID
        self.run_test(
            "Invalid Movie ID",
            "GET",
            "/movies/invalid-id",
            404
        )
        
        # Test unauthorized access
        old_token = self.token
        self.token = None
        
        self.run_test(
            "Unauthorized Favorites Access",
            "GET",
            "/favorites",
            401
        )
        
        self.token = old_token
        
        # Test duplicate registration
        if self.user_id:
            duplicate_data = {
                "email": "test@example.com",
                "password": "TestPass123!",
                "name": "Duplicate User"
            }
            
            # Register first user
            self.run_test(
                "First Registration",
                "POST",
                "/auth/register",
                200,
                data=duplicate_data
            )
            
            # Try duplicate registration
            self.run_test(
                "Duplicate Registration",
                "POST",
                "/auth/register",
                400,
                data=duplicate_data
            )

def main():
    print("🎬 Starting Movie Website API Testing...")
    print("=" * 50)
    
    tester = MovieWebsiteAPITester()
    
    # Initialize data first
    if not tester.test_init_data():
        print("❌ Failed to initialize data, continuing with existing data...")
    
    # Test movie endpoints
    if not tester.test_get_movies():
        print("❌ Movie endpoints failed, stopping tests")
        return 1
    
    tester.test_get_genres()
    tester.test_get_movie_detail()
    
    # Test authentication
    if not tester.test_user_registration():
        print("❌ User registration failed, stopping auth tests")
        return 1
    
    tester.test_user_login()
    tester.test_get_current_user()
    
    # Test user features (requires auth)
    tester.test_favorites()
    tester.test_watch_history()
    tester.test_reviews()
    
    # Test error cases
    tester.test_error_cases()
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary:")
    print(f"   Total Tests: {tester.tests_run}")
    print(f"   Passed: {tester.tests_passed}")
    print(f"   Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': round(tester.tests_passed/tester.tests_run*100, 1)
            },
            'test_results': tester.test_results,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())