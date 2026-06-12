export const QUESTION_BANK = {
  movement: [
    { id: "mov_1", question: "PRIMARY TRANSPORTATION VECTOR", options: [
      { label: "> WALK / CYCLE", value: "walk_cycle", burnRate: 0 },
      { label: "> AUTO / E-RICKSHAW", value: "auto", burnRate: 200 },
      { label: "> PUBLIC TRANSIT", value: "public_transit", burnRate: 150 },
      { label: "> PERSONAL VEHICLE", value: "personal_vehicle", burnRate: 800 },
      { label: "> REMOTE / WFH", value: "wfh", burnRate: 20 }
    ]},
    { id: "mov_2", question: "ONE-WAY COMMUTE RADIUS", options: [
      { label: "> UNDER 3 KM", value: "under_3", burnRate: 0 },
      { label: "> 3 - 10 KM", value: "3_to_10", burnRate: 100 },
      { label: "> 10 - 25 KM", value: "10_to_25", burnRate: 250 },
      { label: "> OVER 25 KM", value: "over_25", burnRate: 500 }
    ]},
    { id: "mov_3", question: "ANNUAL FLIGHT FREQUENCY", options: [
      { label: "> ZERO", value: "never", burnRate: 0 },
      { label: "> 1-2 DOMESTIC", value: "1_2_domestic", burnRate: 300 },
      { label: "> 3-5 MIXED", value: "3_5_mixed", burnRate: 700 },
      { label: "> 6+ / INTERNATIONAL", value: "6_plus", burnRate: 1500 }
    ]},
    { id: "mov_4", question: "WEEKLY DELIVERY LOGISTICS", options: [
      { label: "> 0-2 ORDERS", value: "0_2", burnRate: 50 },
      { label: "> 3-5 ORDERS", value: "3_5", burnRate: 150 },
      { label: "> 6-10 ORDERS", value: "6_10", burnRate: 300 },
      { label: "> 10+ ORDERS", value: "10_plus", burnRate: 500 }
    ]},
    { id: "mov_5", question: "VEHICLE PROPULSION SYSTEM", options: [
      { label: "> NO VEHICLE", value: "no_vehicle", burnRate: 0 },
      { label: "> ELECTRIC (EV)", value: "electric", burnRate: 80 },
      { label: "> CNG / HYBRID", value: "cng_hybrid", burnRate: 200 },
      { label: "> PETROL", value: "petrol", burnRate: 500 },
      { label: "> DIESEL", value: "diesel", burnRate: 650 }
    ]}
  ],
  food: [
    { id: "food_1", question: "ANIMAL PROTEIN FREQUENCY", options: [
      { label: "> VEGETARIAN / VEGAN", value: "veg_vegan", burnRate: 0 },
      { label: "> 1-2X PER WEEK", value: "1_2_week", burnRate: 150 },
      { label: "> 3-4X PER WEEK", value: "3_4_week", burnRate: 350 },
      { label: "> DAILY CONSUMPTION", value: "daily", burnRate: 600 }
    ]},
    { id: "food_2", question: "RED MEAT (BEEF/MUTTON) INTAKE", options: [
      { label: "> NEVER", value: "never", burnRate: 0 },
      { label: "> OCCASIONAL", value: "occasional", burnRate: 200 },
      { label: "> WEEKLY", value: "weekly", burnRate: 500 },
      { label: "> FREQUENT", value: "frequent", burnRate: 1000 }
    ]},
    { id: "food_3", question: "SUPPLY CHAIN SOURCE", options: [
      { label: "> LOCAL MARKET", value: "local", burnRate: 50 },
      { label: "> MIXED SOURCE", value: "mixed", burnRate: 150 },
      { label: "> SUPERMARKET PACKAGED", value: "supermarket", burnRate: 300 },
      { label: "> APP DELIVERY HEAVY", value: "delivery_apps", burnRate: 450 }
    ]},
    { id: "food_4", question: "WEEKLY CALORIC WASTE", options: [
      { label: "> ALMOST ZERO", value: "almost_none", burnRate: 0 },
      { label: "> MINIMAL SCRAPS", value: "small", burnRate: 80 },
      { label: "> ONE MEAL EQUIVALENT", value: "one_meal", burnRate: 200 },
      { label: "> SIGNIFICANT WASTE", value: "significant", burnRate: 400 }
    ]},
    { id: "food_5", question: "PROCESSED FOOD RELIANCE", options: [
      { label: "> MINIMAL / HOME COOKED", value: "minimal", burnRate: 50 },
      { label: "> MODERATE / SNACKS", value: "some", burnRate: 150 },
      { label: "> HEAVY PACKAGED", value: "most", burnRate: 300 },
      { label: "> TOTAL RELIANCE", value: "entirely", burnRate: 500 }
    ]}
  ],
  home: [
    { id: "home_1", question: "AC OPERATIONAL HOURS", options: [
      { label: "> ZERO AC", value: "no_ac", burnRate: 0 },
      { label: "> 2-4 HOURS DAILY", value: "2_4_hrs", burnRate: 300 },
      { label: "> 4-8 HOURS DAILY", value: "4_8_hrs", burnRate: 600 },
      { label: "> 24/7 ACTIVE", value: "all_day", burnRate: 1000 }
    ]},
    { id: "home_2", question: "AC THERMOSTAT SETTING", options: [
      { label: "> NO AC", value: "no_ac", burnRate: 0 },
      { label: "> 25°C OR ABOVE", value: "25_plus", burnRate: 0 },
      { label: "> 23°C - 24°C", value: "23_24", burnRate: 100 },
      { label: "> 21°C - 22°C", value: "21_22", burnRate: 250 },
      { label: "> 20°C OR BELOW", value: "20_below", burnRate: 500 }
    ]},
    { id: "home_3", question: "MONTHLY ENERGETIC COST (INR)", options: [
      { label: "> UNDER 500", value: "under_500", burnRate: 100 },
      { label: "> 500 - 1500", value: "500_1500", burnRate: 250 },
      { label: "> 1500 - 3000", value: "1500_3000", burnRate: 500 },
      { label: "> OVER 3000", value: "over_3000", burnRate: 800 }
    ]},
    { id: "home_4", question: "RENEWABLE INTEGRATION", options: [
      { label: "> SOLAR INSTALLED", value: "solar", burnRate: -200 },
      { label: "> GREEN ENERGY PLAN", value: "green_plan", burnRate: -100 },
      { label: "> LED / EFFICIENCY", value: "efficiency", burnRate: -50 },
      { label: "> NONE", value: "none", burnRate: 0 }
    ]},
    { id: "home_5", question: "HOUSEHOLD DENSITY", options: [
      { label: "> LIVE ALONE", value: "alone", burnRate: 300 },
      { label: "> 2 INDIVIDUALS", value: "two", burnRate: 150 },
      { label: "> 3-4 INDIVIDUALS", value: "3_4", burnRate: 80 },
      { label: "> 5+ INDIVIDUALS", value: "5_plus", burnRate: 40 }
    ]}
  ],
  consumption: [
    { id: "cons_1", question: "APPAREL ACQUISITION RATE", options: [
      { label: "> RARELY / SECONDHAND", value: "rarely", burnRate: 50 },
      { label: "> ANNUAL ESSENTIALS", value: "1_2_year", burnRate: 150 },
      { label: "> SEASONAL UPDATES", value: "few_months", burnRate: 300 },
      { label: "> MONTHLY / TRENDS", value: "monthly", burnRate: 600 }
    ]},
    { id: "cons_2", question: "HARDWARE REFRESH (ANNUAL)", options: [
      { label: "> ZERO / REPAIR", value: "none", burnRate: 0 },
      { label: "> 1 DEVICE (PHONE)", value: "one", burnRate: 200 },
      { label: "> 2-3 DEVICES", value: "2_3", burnRate: 450 },
      { label: "> 4+ DEVICES", value: "4_plus", burnRate: 800 }
    ]},
    { id: "cons_3", question: "DATA CENTER LOAD (STREAMING)", options: [
      { label: "> UNDER 2 HOURS", value: "under_2", burnRate: 50 },
      { label: "> 2-4 HOURS", value: "2_4", burnRate: 120 },
      { label: "> 4-8 HOURS", value: "4_8", burnRate: 250 },
      { label: "> 8+ HOURS DAILY", value: "8_plus", burnRate: 450 }
    ]},
    { id: "cons_4", question: "SINGLE-USE PLASTIC USAGE", options: [
      { label: "> ALMOST NEVER", value: "never", burnRate: 0 },
      { label: "> OCCASIONAL", value: "occasional", burnRate: 100 },
      { label: "> REGULAR", value: "regular", burnRate: 250 },
      { label: "> DAILY", value: "daily", burnRate: 450 }
    ]},
    { id: "cons_5", question: "REPAIR VS REPLACE PHILOSOPHY", options: [
      { label: "> REPAIR FIRST", value: "repair_first", burnRate: 0 },
      { label: "> MIXED APPROACH", value: "mixed", burnRate: 150 },
      { label: "> BUY NEW", value: "buy_new", burnRate: 350 },
      { label: "> LATEST VERSION ONLY", value: "always_new", burnRate: 600 }
    ]}
  ],
  waterWaste: [
    { id: "ww_1", question: "SHOWER DURATION", options: [
      { label: "> UNDER 3 MIN", value: "under_3", burnRate: 20 },
      { label: "> 3-5 MIN", value: "3_5", burnRate: 60 },
      { label: "> 5-10 MIN", value: "5_10", burnRate: 130 },
      { label: "> 10+ MIN", value: "10_plus", burnRate: 250 }
    ]},
    { id: "ww_2", question: "WASTE SEGREGATION PROTOCOL", options: [
      { label: "> FULL COMPLIANCE", value: "full", burnRate: -100 },
      { label: "> PARTIAL (WET/DRY)", value: "partial", burnRate: -50 },
      { label: "> RARELY", value: "rarely", burnRate: 50 },
      { label: "> NO SEGREGATION", value: "none", burnRate: 150 }
    ]},
    { id: "ww_3", question: "PLASTIC BOTTLE CONSUMPTION", options: [
      { label: "> ZERO / REUSABLE", value: "zero", burnRate: 0 },
      { label: "> 1-3 BOTTLES", value: "1_3", burnRate: 80 },
      { label: "> 4-7 BOTTLES", value: "4_7", burnRate: 180 },
      { label: "> 7+ BOTTLES WEEKLY", value: "7_plus", burnRate: 320 }
    ]},
    { id: "ww_4", question: "DISPOSAL ARCHITECTURE", options: [
      { label: "> HOME COMPOSTING", value: "compost", burnRate: -80 },
      { label: "> MUNICIPAL (SEGREGATED)", value: "municipal_seg", burnRate: 50 },
      { label: "> MUNICIPAL (MIXED)", value: "municipal_no_seg", burnRate: 150 },
      { label: "> OPEN DUMPING / BURN", value: "burn_dump", burnRate: 400 }
    ]},
    { id: "ww_5", question: "WATER FLOW DISCIPLINE", options: [
      { label: "> ALWAYS OFF", value: "never", burnRate: 0 },
      { label: "> USUALLY OFF", value: "usually", burnRate: 40 },
      { label: "> OFTEN RUNNING", value: "often", burnRate: 100 },
      { label: "> ALWAYS RUNNING", value: "always", burnRate: 180 }
    ]}
  ],
  work: [
    { id: "work_1", question: "OPERATIONAL WORKSPACE", options: [
      { label: "> FULL REMOTE", value: "full_remote", burnRate: 50 },
      { label: "> HYBRID", value: "hybrid", burnRate: 200 },
      { label: "> FULL OFFICE", value: "full_office", burnRate: 400 },
      { label: "> TRAVEL / FIELD WORK", value: "field", burnRate: 600 }
    ]},
    { id: "work_2", question: "DAILY VIDEO UPLINK LOAD", options: [
      { label: "> 0-2 CALLS", value: "0_2", burnRate: 30 },
      { label: "> 3-5 CALLS", value: "3_5", burnRate: 80 },
      { label: "> 6-10 CALLS", value: "6_10", burnRate: 160 },
      { label: "> 10+ CALLS DAILY", value: "10_plus", burnRate: 280 }
    ]},
    { id: "work_3", question: "FACILITY INFRASTRUCTURE", options: [
      { label: "> HOME OFFICE", value: "home", burnRate: 30 },
      { label: "> ENERGY EFFICIENT", value: "modern", burnRate: 100 },
      { label: "> TRADITIONAL AC OFFICE", value: "old_ac", burnRate: 300 },
      { label: "> INDUSTRIAL / FACTORY", value: "industrial", burnRate: 500 },
      { label: "> OUTDOOR / NO FIXED", value: "outdoor", burnRate: 50 }
    ]},
    { id: "work_4", question: "INSTITUTIONAL GREEN POLICY", options: [
      { label: "> ACTIVE PROGRAMS", value: "strong", burnRate: -150 },
      { label: "> MINIMAL INITIATIVES", value: "minor", burnRate: -50 },
      { label: "> NONE", value: "none", burnRate: 0 },
      { label: "> HEAVY CONSUMPTION", value: "heavy", burnRate: 200 }
    ]},
    { id: "work_5", question: "PAPER / ANALOG RELIANCE", options: [
      { label: "> 100% DIGITAL", value: "digital", burnRate: 0 },
      { label: "> MINIMAL PRINTING", value: "minimal", burnRate: 50 },
      { label: "> MODERATE PRINTING", value: "moderate", burnRate: 150 },
      { label: "> HEAVY PRINTING", value: "heavy", burnRate: 300 }
    ]}
  ]
};

export const CATEGORY_NAMES = ["MOVEMENT", "FOOD", "HOME", "CONSUMPTION", "WATER & WASTE", "WORK"];
export const CATEGORY_KEYS = ["movement", "food", "home", "consumption", "waterWaste", "work"] as const;
