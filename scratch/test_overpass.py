import httpx
import urllib.parse

lat = 28.6139
lon = 77.2090

headers = {
    "User-Agent": "TriagePlusHealth/1.0 (contact: support@triageplus.org)"
}

# Test 1: Nominatim Search
nom_url = f"https://nominatim.openstreetmap.org/search?q=hospital&format=json&bounded=1&viewbox={lon-0.15},{lat+0.15},{lon+0.15},{lat-0.15}&limit=10"
try:
    res = httpx.get(nom_url, headers=headers, timeout=10.0)
    print("Nominatim Status:", res.status_code)
    data = res.json()
    print("Nominatim Results Count:", len(data))
    for item in data[:5]:
        print("->", item.get("display_name"), "| Lat/Lon:", item.get("lat"), item.get("lon"))
except Exception as e:
    print("Nominatim Error:", e)

# Test 2: Overpass with User-Agent
query = f"""[out:json][timeout:10];
(
  node["amenity"="hospital"](around:10000,{lat},{lon});
  node["healthcare"="hospital"](around:10000,{lat},{lon});
);
out center 8;"""

try:
    overpass_url = "https://overpass-api.de/api/interpreter"
    res2 = httpx.post(overpass_url, data={"data": query}, headers=headers, timeout=10.0)
    print("\nOverpass Status:", res2.status_code)
    if res2.status_code == 200:
        el = res2.json().get("elements", [])
        print("Overpass Results Count:", len(el))
        for item in el[:5]:
            print("->", item.get("tags", {}).get("name"), item.get("lat"), item.get("lon"))
except Exception as e:
    print("Overpass Error:", e)
