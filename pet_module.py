import sys
import json

def calculate_pet_safety(pet_type, weight, age, distance_km, temperature_c):
    alerts = []
    suggestions = []
    comfort_score = 100
    risk = "LOW"
    
    # 1. Temperature Risk Detector
    if temperature_c > 30:
        risk = "HIGH"
        comfort_score -= 20
        alerts.append("HIGH HEAT RISK: Very high temperatures expected.")
        suggestions.append("Avoid route or travel at night.")
    elif temperature_c > 25:
        risk = "MEDIUM"
        comfort_score -= 10
        alerts.append("Medium heat risk detected.")
        suggestions.append("Ensure proper AC and hydration.")
        
    # 2. Smart Rest Stop Planner
    # Assuming average speed of 60 km/h, so 60km = 1 hour
    estimated_hours = distance_km / 60
    rest_stops = int(estimated_hours // 2.5) # Stop every 2.5 hours
    rest_stops_list = []
    if rest_stops > 0:
        suggestions.append(f"Add {rest_stops} rest stop(s) for hydration and walking.")
        for i in range(1, rest_stops + 1):
           rest_stops_list.append({
               "stop": i,
               "at_km": i * 2.5 * 60,
               "after_minutes": i * 150,
               "location": "Suggested Rest Stop",
               "purpose": "Hydration & comfort check"
           })
        if estimated_hours > 8:
            risk = "HIGH" if risk != "HIGH" else risk
            comfort_score -= 15
            alerts.append("Long travel stress risk.")
    
    # 3. Safe Mode Selector
    recommended_mode = "Train"
    if distance_km > 1000:
        recommended_mode = "Air"
        if pet_type.lower() == "dog" and weight > 20: 
            alerts.append("Large pets may experience high stress in air transit cargo.")
            suggestions.append("Prefer Train for comfort over long distances.")
            recommended_mode = "Train"
            comfort_score -= 10
    elif distance_km < 300:
        recommended_mode = "Truck"
        
    # Age factors
    if age > 10 or age < 1:
        risk = "HIGH"
        comfort_score -= 15
        alerts.append("Vulnerable age group (very young or senior).")
        suggestions.append("Requires specialized temperature control and frequent vet checks.")

    # Clamp comfort score
    comfort_score = int(max(0, min(100, comfort_score)))
    
    if comfort_score < 50:
        risk = "HIGH"
    elif comfort_score < 80 and risk != "HIGH":
        risk = "MEDIUM"

    return {
        "comfort_score": comfort_score,
        "risk": risk,
        "heat_risk": "HIGH" if temperature_c > 30 else "MEDIUM" if temperature_c > 25 else "LOW",
        "alerts": alerts,
        "suggestions": suggestions,
        "safe_mode": recommended_mode,
        "safe_mode_reason": "Better comfort for current distance and pet profile.",
        "eta_minutes": int(estimated_hours * 60),
        "analysis": "Python module analysis complete.",
        "rest_stops": rest_stops_list
    }

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
        
    try:
        pet_type = sys.argv[1]
        weight = float(sys.argv[2])
        age = float(sys.argv[3])
        distance = float(sys.argv[4])
        temperature = float(sys.argv[5])
        
        result = calculate_pet_safety(pet_type, weight, age, distance, temperature)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


