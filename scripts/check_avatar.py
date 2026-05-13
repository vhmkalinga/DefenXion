import pymongo

try:
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["DefenXion"]
    user = db.users.find_one({})
    if user:
        print(f"Username: {user.get('username')}")
        avatar = user.get('avatar', '')
        print(f"Avatar length: {len(avatar)}")
        print(f"Avatar preview: {avatar[:100]}")
    else:
        print("No user found")
except Exception as e:
    print(f"Error: {e}")
