from locust import HttpUser, task, between, constant


class WebsiteUser(HttpUser):
    # Users wait 1 to 3 seconds between actions
    wait_time = constant(0)

    # 1. Test the Read/Redirect Speed (Expected to be FAST via Redis)
    @task(10) # Weight: Users do this 3x more often
    def view_redirect(self):
        # Use a short_code you know exists in your DB!
        # Replace 'test1' with a real code you created.
        self.client.get("/0q41o3", name="/{short_code}", allow_redirects=False)

    # 2. Test the Write Speed (Expected to be SLOWER via Postgres)
    @task(1)
    def create_url(self):
        self.client.post("/shorten", json={
            "url": "https://www.google.com",
            "duration": 24
        })