#!/usr/bin/env python3
"""
Shareable Link Generation Test
Tests the specific shareable link functionality as requested by the user
"""

import requests
import json
import sys
from typing import Dict, Any, Optional
import uuid

class ShareableLinkTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.admin_token = None
        self.form_id = None
        self.shareable_link = None
        
        # Test data with unique identifiers
        unique_id = str(uuid.uuid4())[:8]
        self.admin_user_data = {
            "username": f"prof_anderson_{unique_id}",
            "email": f"prof.anderson.{unique_id}@university.edu",
            "password": "SecurePassword123!",
            "role": "admin"
        }
        
        # Test form data as specified by user
        self.feedback_form_data = {
            "title": "Test Form",
            "year": "2024",
            "section": "A",
            "department": "Computer Science",
            "subjects": ["Math", "Physics"],
            "evaluation_criteria": ["Teaching Quality", "Course Content"]
        }

    def log_test(self, test_name: str, success: bool, details: str = ""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    headers: Optional[Dict] = None, auth_required: bool = False) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
            
        if auth_required and self.admin_token:
            request_headers["Authorization"] = f"Bearer {self.admin_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=request_headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def test_admin_registration(self) -> bool:
        """Step 1: Register a new admin user"""
        try:
            response = self.make_request("POST", "/api/auth/register", self.admin_user_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = all(key in data for key in ["access_token", "role", "user_id"])
                if success:
                    self.admin_token = data["access_token"]
                    self.log_test("Admin Registration", True, f"Role: {data.get('role')}, User ID: {data.get('user_id')}")
                else:
                    self.log_test("Admin Registration", False, "Missing required fields in response")
            else:
                error_detail = response.json().get("detail", "Unknown error") if response.content else "No response content"
                self.log_test("Admin Registration", False, f"Status code: {response.status_code}, Error: {error_detail}")
                
            return success
        except Exception as e:
            self.log_test("Admin Registration", False, f"Exception: {str(e)}")
            return False

    def test_admin_login(self) -> bool:
        """Step 2: Login as the admin"""
        try:
            login_data = {
                "username": self.admin_user_data["username"],
                "password": self.admin_user_data["password"]
            }
            
            response = self.make_request("POST", "/api/auth/login", login_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = all(key in data for key in ["access_token", "role", "user_id"])
                if success:
                    self.admin_token = data["access_token"]
                    self.log_test("Admin Login", True, f"Role: {data.get('role')}")
                else:
                    self.log_test("Admin Login", False, "Missing required fields in response")
            else:
                error_detail = response.json().get("detail", "Unknown error") if response.content else "No response content"
                self.log_test("Admin Login", False, f"Status code: {response.status_code}, Error: {error_detail}")
                
            return success
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_create_feedback_form(self) -> bool:
        """Step 3: Create a new feedback form with test data"""
        try:
            response = self.make_request("POST", "/api/forms", self.feedback_form_data, auth_required=True)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["id", "title", "year", "section", "department", "subjects", "evaluation_criteria", "shareable_link"]
                success = all(key in data for key in required_fields)
                if success:
                    self.form_id = data["id"]
                    self.shareable_link = data["shareable_link"]
                    self.log_test("Create Feedback Form", True, 
                                f"Form ID: {self.form_id}\n   Title: {data.get('title')}\n   Shareable Link: {self.shareable_link}")
                else:
                    self.log_test("Create Feedback Form", False, f"Missing fields. Got: {list(data.keys())}")
            else:
                error_detail = response.json().get("detail", "Unknown error") if response.content else "No response content"
                self.log_test("Create Feedback Form", False, f"Status code: {response.status_code}, Error: {error_detail}")
                
            return success
        except Exception as e:
            self.log_test("Create Feedback Form", False, f"Exception: {str(e)}")
            return False

    def test_shareable_link_analysis(self) -> bool:
        """Step 4: Analyze the generated shareable_link"""
        if not self.shareable_link:
            self.log_test("Shareable Link Analysis", False, "No shareable link available from previous test")
            return False
            
        try:
            # Check if the shareable link uses the correct frontend URL
            expected_frontend_url = "https://37229bc6-49d3-44df-9f81-66ed275eb5ea.preview.emergentagent.com"
            localhost_fallback = "http://localhost:3000"
            
            if localhost_fallback in self.shareable_link:
                self.log_test("Shareable Link Analysis", False, 
                            f"❌ ISSUE FOUND: Shareable link uses localhost fallback instead of production URL\n" +
                            f"   Generated Link: {self.shareable_link}\n" +
                            f"   Expected to contain: {expected_frontend_url}\n" +
                            f"   Root Cause: FRONTEND_URL environment variable not set in backend/.env")
                return False
            elif expected_frontend_url in self.shareable_link:
                self.log_test("Shareable Link Analysis", True, 
                            f"Shareable link uses correct production URL\n   Link: {self.shareable_link}")
                return True
            else:
                self.log_test("Shareable Link Analysis", False, 
                            f"Shareable link uses unexpected URL\n   Link: {self.shareable_link}")
                return False
                
        except Exception as e:
            self.log_test("Shareable Link Analysis", False, f"Exception: {str(e)}")
            return False

    def test_shareable_link_endpoint(self) -> bool:
        """Step 5: Test if the shareable link endpoint returns form data correctly"""
        if not self.form_id:
            self.log_test("Shareable Link Endpoint Test", False, "No form ID available from previous test")
            return False
            
        try:
            # Test the public endpoint that the shareable link should point to
            response = self.make_request("GET", f"/api/forms/{self.form_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ["id", "title", "year", "section", "department", "subjects", "evaluation_criteria"]
                success = all(key in data for key in required_fields)
                if success:
                    # Verify the data matches what we created
                    data_matches = (
                        data.get("title") == self.feedback_form_data["title"] and
                        data.get("year") == self.feedback_form_data["year"] and
                        data.get("section") == self.feedback_form_data["section"] and
                        data.get("department") == self.feedback_form_data["department"] and
                        data.get("subjects") == self.feedback_form_data["subjects"] and
                        data.get("evaluation_criteria") == self.feedback_form_data["evaluation_criteria"]
                    )
                    
                    if data_matches:
                        self.log_test("Shareable Link Endpoint Test", True, 
                                    f"Endpoint /api/forms/{self.form_id} returns correct form data\n" +
                                    f"   Title: {data.get('title')}\n" +
                                    f"   Department: {data.get('department')}\n" +
                                    f"   Subjects: {data.get('subjects')}\n" +
                                    f"   Criteria: {data.get('evaluation_criteria')}")
                    else:
                        self.log_test("Shareable Link Endpoint Test", False, "Form data doesn't match created data")
                        success = False
                else:
                    self.log_test("Shareable Link Endpoint Test", False, f"Missing fields. Got: {list(data.keys())}")
            else:
                error_detail = response.json().get("detail", "Unknown error") if response.content else "No response content"
                self.log_test("Shareable Link Endpoint Test", False, f"Status code: {response.status_code}, Error: {error_detail}")
                
            return success
        except Exception as e:
            self.log_test("Shareable Link Endpoint Test", False, f"Exception: {str(e)}")
            return False

    def run_shareable_link_tests(self) -> Dict[str, bool]:
        """Run all shareable link tests as requested by user"""
        print("🔗 Testing Shareable Link Generation in Teacher Feedback Collection System")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        results = {}
        
        # Test sequence as requested by user
        test_methods = [
            ("1. Register New Admin User", self.test_admin_registration),
            ("2. Login as Admin", self.test_admin_login),
            ("3. Create Feedback Form with Test Data", self.test_create_feedback_form),
            ("4. Analyze Generated Shareable Link", self.test_shareable_link_analysis),
            ("5. Test Shareable Link Endpoint", self.test_shareable_link_endpoint),
        ]
        
        for test_name, test_method in test_methods:
            try:
                results[test_name] = test_method()
            except Exception as e:
                print(f"❌ FAIL {test_name} - Unexpected error: {str(e)}")
                results[test_name] = False
        
        # Summary
        print("=" * 80)
        print("📊 SHAREABLE LINK TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Specific findings about FRONTEND_URL issue
        print("\n🔍 KEY FINDINGS:")
        if not results.get("4. Analyze Generated Shareable Link", False):
            print("❌ CRITICAL ISSUE: FRONTEND_URL environment variable is not set in backend/.env")
            print("   This causes shareable links to use 'http://localhost:3000' instead of the production URL")
            print("   Solution: Add FRONTEND_URL=https://37229bc6-49d3-44df-9f81-66ed275eb5ea.preview.emergentagent.com to backend/.env")
        else:
            print("✅ Shareable link generation is working correctly")
            
        if results.get("5. Test Shareable Link Endpoint", False):
            print("✅ Shareable link endpoint (/api/forms/{form_id}) is working correctly")
        else:
            print("❌ Shareable link endpoint has issues")
        
        return results


def main():
    # Use the production backend URL
    backend_url = "https://37229bc6-49d3-44df-9f81-66ed275eb5ea.preview.emergentagent.com"
    
    print(f"Shareable Link Test Suite")
    print(f"Target URL: {backend_url}")
    print()
    
    tester = ShareableLinkTester(backend_url)
    results = tester.run_shareable_link_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()