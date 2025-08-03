import tweepy

def tweet(strategy):
    api_key = "Vu1IklQ28Y1mssjixXImhHtmt" 
    api_secret = "6VLgw1jAulNa3TnvNjwrooSxAfMmIGl5baSaAXZGx9EXRiMYoR"
    bearer_token = r"AAAAAAAAAAAAAAAAAAAAAB9k2gEAAAAAMYxDBWBn7i%2B%2BAvtZoHUlnue2Ad8%3DDLKksJLyJTt7sc1b7I2WlWEfxrNYMMZbngiAXPZsT86qgLY2Uc"
    
    access_token = "1935697658397773824-HJ3QGxnOdTC8FsOLioSejrn5qis9Pv"
    access_token_secret = "pbrC6XXZZbUxgZXdkyJMHgwYLsKHylDCvUpPwfpAaLnNo"
    
    client = tweepy.Client(bearer_token, api_key, api_secret, access_token, access_token_secret)
    auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_token_secret)
    
    api = tweepy.API(auth)
    
    if len(strategy) > 280:
        strategy = strategy[:200] + '...'

    client.create_tweet(text=strategy)
    print("Tweet posted:", strategy)