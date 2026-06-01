# from locust import HttpUser, task, between, constant
#
#
# class WebsiteUser(HttpUser):
#     # Users wait 1 to 3 seconds between actions
#     wait_time = constant(0)
#
#     # 1. Test the Read/Redirect Speed (Expected to be FAST via Redis)
#     @task(10) # Weight: Users do this 3x more often
#     def view_redirect(self):
#         # Use a short_code you know exists in your DB!
#         # Replace 'test1' with a real code you created.
#         self.client.get("/0q41o3", name="/{short_code}", allow_redirects=False)
#
#     # 2. Test the Write Speed (Expected to be SLOWER via Postgres)
#     @task(1)
#     def create_url(self):
#         self.client.post("/shorten", json={
#             "url": "https://www.google.com",
#             "duration": 24
#         })

import random
from locust import HttpUser, task, between
import string

class URLShortenerTester(HttpUser):
    # Wait 1 to 3 seconds between tasks to simulate real human behavior
    wait_time = between(1, 3)

    def on_start(self):
        # Setup: Keep track of created short URLs to test the redirect endpoint later
        self.created_short_codes = []

    @task(2) # Weight of 2: Happens twice as often as the redirect task
    def create_short_url(self):
        # Generate a random long URL to prevent Redis from perfectly caching everything
        random_string = ''.join(random.choices(string.ascii_letters, k=10))
        target_url = f"https://www.example.com/{random_string}"

        # POST to your /shorten endpoint
        response = self.client.post("/shorten", json={
            "url": target_url,
            "duration": 7
        }, name="Create Short URL") # Naming it groups it nicely in the Locust UI

        if response.status_code == 200:
            data = response.json()
            # Extract just the code from the returned URL (e.g., getting 'abc12' from 'https://url-shortener.pranaykamble.me/abc12')
            short_url = data.get("shorturl", "")
            short_code = short_url.split("/")[-1]
            if short_code:
                self.created_short_codes.append(short_code)

    @task(1) # Weight of 1
    def redirect_url(self):
        # Only test redirect if we have actually created a URL first
        if len(self.created_short_codes) > 0:
            # Pick a random code we generated
            short_code = random.choice(self.created_short_codes)

            # GET request to trigger the redirect
            # catch_response=True allows us to mark a 307 Redirect as a "Success" instead of an error
            with self.client.get(f"/{short_code}", catch_response=True, allow_redirects=False, name="Redirect URL") as response:
                if response.status_code in (301, 302, 303, 307):
                    response.success()
                else:
                    response.failure(f"Expected redirect, got {response.status_code}")