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



# ──────────────────────────────────────────────
# 3. Smart Rest Stop Planner
# ──────────────────────────────────────────────

def plan_rest_stops(distance_km: float, eta_minutes: int) -> list[dict]:
    """
    Add a hydration/break stop every 2–3 hours.
    Returns list of stops with estimated km mark and purpose.
    """
    stops = []
    interval_min = 150  # 2.5-hour intervals
    elapsed = 0
    stop_num = 1

    while elapsed + interval_min < eta_minutes:
        elapsed += interval_min
        km_mark = round((elapsed / eta_minutes) * distance_km)
        stops.append({
            "stop": stop_num,
            "at_km": km_mark,
            "after_minutes": elapsed,
            "purpose": "Hydration, ventilation & comfort check",
            "duration_min": 15,
        })
        stop_num += 1

    return stops


# ──────────────────────────────────────────────
# 4. Safe Transport Mode Selector
# ──────────────────────────────────────────────

def select_safe_mode(
    distance_km: float,
    temperature_c: float,
    pet_type: PetType,
    weight_kg: float,
) -> tuple[TransportMode, str]:
    """
    Returns (mode, reason).

    Rules:
      - Air   : avoid for long-haul stress; cats especially stressed
      - Train : best for comfort on 200–800 km routes
      - Truck : fine for short trips with climate control
    """
    if temperature_c > 38 and distance_km > 300:
        return "Train", "High heat + long distance — train preferred for AC comfort"

    if distance_km > 700:
        if pet_type == "cat":
            return "Train", "Long distance + cat = train preferred; air cargo too stressful"
        if weight_kg > 32:
            return "Truck", "Heavy dog — air cargo restrictions apply; truck with climate control"
        return "Train", "Long journey — train reduces motion stress"

    if distance_km > 200:
        return "Train", "Medium-long route — train offers smooth ride and temperature control"

    return "Truck", "Short route — temperature-controlled truck is ideal"


# ──────────────────────────────────────────────
# 5. Full Pet Plan Generator
# ──────────────────────────────────────────────

def generate_pet_plan(
    pet_type: PetType,
    weight_kg: float,
    age_years: float,
    source: str,
    destination: str,
    distance_km: float,
    temperature_c: float = 35.0,
    eta_minutes: int | None = None,
    priority: str = "medium",
) -> dict:
    """
    Main entry point — returns structured pet safety plan.

    Output schema:
    {
        "comfort_score": int,
        "risk": "LOW" | "MEDIUM" | "HIGH",
        "heat_risk": "LOW" | "MEDIUM" | "HIGH",
        "safe_mode": "Truck" | "Train" | "Air",
        "safe_mode_reason": str,
        "alerts": [str],
        "suggestions": [str],
        "rest_stops": [{stop, at_km, after_minutes, purpose, duration_min}],
        "eta_minutes": int,
    }
    """
    # Estimate ETA if not provided (60 km/h base)
    if eta_minutes is None:
        base = round((distance_km / 60) * 60)
        # Delay for temperature (animals travel slower in heat = rest stops)
        if temperature_c > 35:
            base = round(base * 1.15)
        eta_minutes = base

    heat_risk = detect_heat_risk(temperature_c)
    safe_mode, safe_mode_reason = select_safe_mode(distance_km, temperature_c, pet_type, weight_kg)
    comfort_score = calculate_comfort_score(
        pet_type, weight_kg, age_years, temperature_c, eta_minutes, safe_mode
    )
    rest_stops = plan_rest_stops(distance_km, eta_minutes)

    # ── Build alerts ──
    alerts: list[str] = []
    if heat_risk == "HIGH":
        alerts.append(f"HIGH HEAT RISK ({temperature_c}°C) → avoid route or travel at night")
    elif heat_risk == "MEDIUM":
        alerts.append(f"Moderate heat ({temperature_c}°C) — ensure AC throughout journey")

    if eta_minutes > 360:
        alerts.append(f"Long journey ({eta_minutes} min) — travel stress risk is elevated")

    if age_years < 0.5:
        alerts.append("Very young pet — extra monitoring required during transport")
    elif age_years > 12:
        alerts.append("Senior pet — limit journey time, consult vet before travel")

    if pet_type == "cat" and safe_mode == "Air":
        alerts.append("Cats are highly stressed by air cargo — switch to ground transport")

    if comfort_score < 45:
        alerts.append("LOW comfort score — reconsider transport plan")

    # ── Build suggestions ──
    suggestions: list[str] = []
    if heat_risk in ("HIGH", "MEDIUM"):
        suggestions.append("Add rest stop at shaded location for hydration")
        suggestions.append("Change route to avoid peak heat hours (12 PM – 4 PM)")

    if len(rest_stops) > 0:
        first_stop = rest_stops[0]
        suggestions.append(
            f"Stop at ~{first_stop['at_km']} km mark for hydration ({first_stop['after_minutes']} min into journey)"
        )

    if safe_mode == "Train":
        suggestions.append("Book pet-friendly train compartment with ventilation")
    elif safe_mode == "Truck":
        suggestions.append("Ensure climate-controlled cargo area — keep below 25°C")

    if comfort_score < 60:
        suggestions.append("Consider splitting journey into 2 days with overnight rest")

    # ── Determine overall risk ──
    if comfort_score < 45 or heat_risk == "HIGH":
        overall_risk: RiskLevel = "HIGH"
    elif comfort_score < 65 or heat_risk == "MEDIUM":
        overall_risk = "MEDIUM"
    else:
        overall_risk = "LOW"

    return {
        "comfort_score": comfort_score,
        "risk": overall_risk,
        "heat_risk": heat_risk,
        "safe_mode": safe_mode,
        "safe_mode_reason": safe_mode_reason,
        "alerts": alerts,
        "suggestions": suggestions,
        "rest_stops": rest_stops,
        "eta_minutes": eta_minutes,
        "source": source,
        "destination": destination,
    }


# ──────────────────────────────────────────────
# Demo scenario (matches spec demo)
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("PET LOGISTICS SAFETY MODULE — Demo")
    print("=" * 60)

    result = generate_pet_plan(
        pet_type="dog",
        weight_kg=18,
        age_years=3,
        source="Bangalore",
        destination="Chennai",
        distance_km=350,
        temperature_c=42,   # Hot Indian summer
        priority="high",
    )

    print(json.dumps(result, indent=2))

    print("\n--- KEY OUTPUTS ---")
    print(f"Comfort Score : {result['comfort_score']} / 100")
    print(f"Overall Risk  : {result['risk']}")
    print(f"Heat Risk     : {result['heat_risk']}")
    print(f"Safe Mode     : {result['safe_mode']}  ({result['safe_mode_reason']})")
    print(f"ETA           : {result['eta_minutes']} min")
    print(f"\nAlerts ({len(result['alerts'])}):")
    for a in result["alerts"]:
        print(f"  ⚠  {a}")
    print(f"\nSuggestions ({len(result['suggestions'])}):")
    for s in result["suggestions"]:
        print(f"  ✓  {s}")
    print(f"\nRest Stops ({len(result['rest_stops'])}):")
    for stop in result["rest_stops"]:
        print(f"  Stop {stop['stop']}: km {stop['at_km']} — {stop['purpose']}")
