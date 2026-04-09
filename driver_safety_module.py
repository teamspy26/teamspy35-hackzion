import sys
import json

def calculate_driver_risk(stop_time_mins, speed_variation_pct, is_off_route, is_night_driving):
    alerts = []
    suggestions = []
    safety_score = 100
    risk = "LOW"
    
    # 1. Suspicious Stop Detection
    if stop_time_mins > 45:
        safety_score -= 30
        alerts.append("Unusually long unauthorized stop detected (>45 mins)")
        suggestions.append("Contact driver immediately")
        risk = "HIGH"
    elif stop_time_mins > 20:
        safety_score -= 15
        alerts.append("Suspicious stop detected (>20 mins)")
        suggestions.append("Monitor closely")
        if risk == "LOW": risk = "MEDIUM"

    # 2. Route Deviation Detection
    if is_off_route:
        safety_score -= 25
        alerts.append("Route deviation detected")
        if "Contact driver immediately" not in suggestions:
            suggestions.append("Contact driver immediately to confirm route")
        if risk != "HIGH": risk = "MEDIUM"
        
    # 3. Erratic Driving
    if speed_variation_pct > 20:
        safety_score -= 20
        alerts.append(f"Erratic driving detected (Speed variation {speed_variation_pct}%)")
        suggestions.append("Send automated safety warning to vehicle dashboard")
        if risk != "HIGH": risk = "MEDIUM"
        
    # 4. Night Driving Risks
    if is_night_driving:
        safety_score -= 10
        alerts.append("Driver operating at risky times (Night)")
        suggestions.append("Ensure driver has taken mandatory rest breaks")

    # Cap score
    safety_score = max(0, min(100, safety_score))
    
    if safety_score < 50:
        risk = "HIGH"
    elif safety_score < 80 and risk != "HIGH":
        risk = "MEDIUM"

    if risk == "HIGH" and "Reassign shipment" not in suggestions and safety_score < 30:
        suggestions.append("Consider reassigning shipment or dispatching support")

    return {
        "safety_score": int(safety_score),
        "risk_level": risk,
        "alerts": alerts,
        "suggestions": suggestions
    }

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
        
    try:
        stop_time_mins = float(sys.argv[1])
        speed_variation_pct = float(sys.argv[2])
        is_off_route = sys.argv[3].lower() == 'true'
        is_night_driving = sys.argv[4].lower() == 'true'
        
        result = calculate_driver_risk(stop_time_mins, speed_variation_pct, is_off_route, is_night_driving)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
