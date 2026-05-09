CATEGORY_EXCLUSIONS = {
    "Desktop PC": [
        "adapter", "charger", "power supply", "psu", "ac adapter",
        "vesa", "mount", "bracket", "stand", "case", "shell",
        "lot", "parts", "for parts", "repair", "broken", "spares",
        "manual", "sticker", "decal", "cable", "cord",
    ],
    "Laptop": [
        "adapter", "charger", "battery", "screen", "lcd", "keyboard",
        "palmrest", "shell", "lid", "hinge", "parts", "for parts",
        "broken", "lot", "repair", "bag", "sleeve", "case", "cover",
    ],
    "RAM": [
        "lot", "mixed", "untested", "pulled", "heat spreader",
        "heatsink", "slot", "riser", "adapter", "tester",
    ],
    "Storage - HDD": [
        "caddy", "enclosure", "dock", "adapter", "cable", "lot",
        "head", "platter", "parts", "for parts", "broken",
    ],
    "Storage - SSD": [
        "caddy", "enclosure", "adapter", "heatsink", "lot",
        "parts", "for parts", "broken",
    ],
    "Storage - NVMe": [
        "heatsink", "adapter", "enclosure", "lot", "parts", "broken",
    ],
    "Networking": [
        "cable", "patch cable", "crimper", "tester", "keystone",
        "jack", "lot", "parts", "broken", "faceplate",
    ],
    "GPU": [
        "bracket", "cable", "adapter", "fan", "cooler", "heatsink",
        "lot", "parts", "for parts", "broken", "bios chip", "mining",
    ],
    "CPU": [
        "cooler", "fan", "thermal paste", "lot", "parts",
        "broken", "bent pins", "tray", "oem",
    ],
    "Server": [
        "rail", "rails", "bezel", "caddy", "blank", "filler",
        "adapter", "cable", "lot", "parts", "broken", "manual",
    ],
    "Raspberry Pi / SBC": [
        "case", "heatsink", "fan", "hat", "adapter", "cable",
        "lot", "parts", "sd card", "power supply", "psu",
    ],
    "Any": [
        "lot of", "wholesale", "bulk", "for parts", "broken",
        "untested", "as is",
    ],
}

WATCH_CATEGORIES = list(CATEGORY_EXCLUSIONS.keys())

CONDITION_ID_MAP = {
    "Any": None,
    "New": "1000",
    "Open Box": "1500",
    "Seller Refurbished": "2500",
    "Used - Excellent": "3000",
    "Used - Very Good": "4000",
    "Used - Good": "5000",
    "For Parts / Not Working": "7000",
}

WATCH_CONDITIONS = list(CONDITION_ID_MAP.keys())
