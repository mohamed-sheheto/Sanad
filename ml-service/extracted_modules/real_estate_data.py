import re
import csv
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

FRONTEND_CITIES = [
    "Cairo", "Giza", "Alexandria", "New Cairo",
    "Sheikh Zayed", "6th of October", "North Coast", "Madinaty",
]

FRONTEND_PROPERTY_TYPES = [
    "Apartment", "Villa", "Duplex", "Chalet", "Townhouse", "Penthouse",
]

CITY_KEYWORDS = {
    "New Cairo": ["new cairo", "fifth settlement", "5th settlement", "rehab city"],
    "Madinaty": ["madinaty"],
    "Sheikh Zayed": ["sheikh zayed", "sheikh zayed"],
    "6th of October": ["6th of october", "6 october", "hadayek october"],
    "North Coast": ["north coast", "marina", "sahel", "ras el hekma", "ras al hekma", "hacienda"],
    "Alexandria": ["alexandria", "saba pasha"],
    "Cairo": ["cairo", "new capital", "mostakbal", "shorouk", "new heliopolis",
               "nasr city", "maadi", "heliopolis", "mokattam", "downtown cairo"],
    "Giza": ["giza", "haram", "faisal", "markaz"],
}

REAL_ESTATE_CITIES = {
    "Cairo": "Cairo",
    "Giza": "Giza",
    "Alexandria": "Alexandria",
    "New Cairo": "New Cairo",
    "Sheikh Zayed": "Sheikh Zayed",
    "6th of October": "6th of October",
    "North Coast": "North Coast",
    "Madinaty": "Madinaty",
}


def _extract_city(location: str) -> str:
    loc_lower = location.lower()
    for city, keywords in CITY_KEYWORDS.items():
        for kw in keywords:
            if kw in loc_lower:
                return city
    if "giza" in loc_lower:
        return "Giza"
    if "cairo" in loc_lower or "capital" in loc_lower:
        return "Cairo"
    if "suez" in loc_lower or "ain sukhna" in loc_lower:
        return "Cairo"
    if "matruh" in loc_lower or "alamein" in loc_lower:
        return "North Coast"
    if "red sea" in loc_lower or "hurghada" in loc_lower:
        return "Alexandria"
    parts = [p.strip() for p in location.split(",")]
    last = parts[-1].strip() if parts else location.strip()
    if last in FRONTEND_CITIES:
        return last
    if last == "Matruh":
        return "North Coast"
    return "Cairo"


def _parse_price(price_str: str) -> Optional[float]:
    if not price_str:
        return None
    cleaned = price_str.replace(",", "").replace('"', "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_area(area_str: str) -> Optional[float]:
    if not area_str:
        return None
    cleaned = area_str.replace(",", "").strip()
    match = re.search(r"([\d.]+)", cleaned)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return None
    return None


class RealEstateDataLoader:

    def __init__(self, csv_path: Optional[Path] = None):
        if csv_path is None:
            csv_path = Path(__file__).resolve().parent.parent / "models" / "real_estate_data_bayut_full.csv"
        self.csv_path = Path(csv_path)
        self._data: List[dict] = []
        self._city_stats: Dict[str, dict] = {}
        self._type_stats: Dict[str, dict] = {}
        self._loaded = False

    def load(self) -> "RealEstateDataLoader":
        logger.info(f"Loading real estate data from {self.csv_path}")
        if not self.csv_path.exists():
            logger.warning(f"CSV not found at {self.csv_path}, using synthetic fallback")
            self._generate_fallback_data()
            self._loaded = True
            return self

        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                location = row.get("location", "").strip()
                prop_type = row.get("type", "").strip()
                price = _parse_price(row.get("price", ""))
                area = _parse_area(row.get("area", ""))

                if price is None or area is None or area == 0:
                    continue
                if prop_type not in FRONTEND_PROPERTY_TYPES:
                    continue

                city = _extract_city(location)
                if city not in FRONTEND_CITIES:
                    continue

                price_per_sqm = price / area

                self._data.append({
                    "city": city,
                    "property_type": prop_type,
                    "price": price,
                    "area": area,
                    "price_per_sqm": price_per_sqm,
                })

        self._compute_stats()
        self._loaded = True
        logger.info(f"Loaded {len(self._data)} listings across {len(self._city_stats)} cities")
        return self

    def _generate_fallback_data(self):
        fallback_price_per_sqm = {
            "Cairo": 18000, "Giza": 15000, "Alexandria": 12000,
            "New Cairo": 22000, "Sheikh Zayed": 20000, "6th of October": 14000,
            "North Coast": 35000, "Madinaty": 16000,
        }
        fallback_type_multiplier = {
            "Apartment": 1.0, "Villa": 2.5, "Duplex": 1.6,
            "Chalet": 1.3, "Townhouse": 1.8, "Penthouse": 2.0,
        }
        for city in FRONTEND_CITIES:
            base = fallback_price_per_sqm.get(city, 15000)
            for ptype in FRONTEND_PROPERTY_TYPES:
                mult = fallback_type_multiplier.get(ptype, 1.0)
                avg_area = {"Apartment": 130, "Villa": 350, "Duplex": 220,
                            "Chalet": 140, "Townhouse": 200, "Penthouse": 230}.get(ptype, 150)
                psqm = base * mult
                self._data.append({
                    "city": city,
                    "property_type": ptype,
                    "price": psqm * avg_area,
                    "area": avg_area,
                    "price_per_sqm": psqm,
                })

    def _compute_stats(self):
        by_city = defaultdict(list)
        for d in self._data:
            by_city[d["city"]].append(d["price_per_sqm"])

        self._city_stats = {}
        for city, values in by_city.items():
            arr = np.array(values)
            self._city_stats[city] = {
                "mean_psqm": float(np.mean(arr)),
                "median_psqm": float(np.median(arr)),
                "std_psqm": float(np.std(arr)),
                "count": len(arr),
            }

        by_type = defaultdict(list)
        for d in self._data:
            by_type[d["property_type"]].append(d["price"])

        self._type_stats = {}
        for ptype, values in by_type.items():
            arr = np.array(values)
            self._type_stats[ptype] = {
                "mean_price": float(np.mean(arr)),
                "median_price": float(np.median(arr)),
                "count": len(arr),
            }

    def generate_time_series(self, city: str, months: int = 72,
                             start_date: str = "2018-01-01") -> pd.DataFrame:
        if not self._loaded:
            self.load()

        stats = self._city_stats.get(city)
        if stats is None:
            stats = {"mean_psqm": 15000, "std_psqm": 2000}

        base_price = stats["mean_psqm"]
        std = stats["std_psqm"]

        dates = pd.date_range(start=start_date, periods=months, freq="MS")
        monthly_growth = np.random.default_rng(42).normal(0.005, 0.015, months)
        monthly_growth = np.cumsum(monthly_growth) + 1
        noise = np.random.default_rng(42).normal(0, std * 0.02, months)
        prices = base_price * monthly_growth + noise
        prices = np.maximum(prices, base_price * 0.5)

        df = pd.DataFrame({
            "Date": dates,
            "Price": prices,
        })
        df.set_index("Date", inplace=True)
        return df

    def get_cities(self) -> List[str]:
        return FRONTEND_CITIES

    def get_property_types(self) -> List[str]:
        return FRONTEND_PROPERTY_TYPES

    def get_city_stats(self, city: str) -> dict:
        if not self._loaded:
            self.load()
        return self._city_stats.get(city, {"mean_psqm": 15000, "std_psqm": 2000, "count": 0})

    def get_type_stats(self) -> List[dict]:
        if not self._loaded:
            self.load()
        return [
            {"type": pt, "avgPrice": round(stats["mean_price"], 0)}
            for pt, stats in self._type_stats.items()
            if pt in FRONTEND_PROPERTY_TYPES
        ]

    def get_market_stats(self, city: str) -> dict:
        if not self._loaded:
            self.load()
        df = self.generate_time_series(city)
        prices = df["Price"].values
        yearly_returns = []
        for i in range(12, len(prices)):
            ret = (prices[i] - prices[i - 12]) / prices[i - 12]
            yearly_returns.append(ret)
        avg_roi = float(np.mean(yearly_returns)) * 100 if yearly_returns else 8.5
        market_growth = ((prices[-1] - prices[-12]) / prices[-12]) * 100 if len(prices) >= 12 else 12.0
        return {
            "averageROI": round(avg_roi, 1),
            "marketGrowth": round(market_growth, 1),
        }

    def get_price_trend(self, city: str) -> List[dict]:
        if not self._loaded:
            self.load()
        df = self.generate_time_series(city)
        return [
            {"month": idx.strftime("%b %Y"), "price": round(float(row["Price"]), 0)}
            for idx, row in df.tail(12).iterrows()
        ]

    def generate_roi_time_series(self, city: str, months: int = 72,
                                  start_date: str = "2018-01-01") -> pd.DataFrame:
        df = self.generate_time_series(city, months, start_date)
        prices = df["Price"].values
        rois = []
        for i in range(12, len(prices)):
            roi = (prices[i] - prices[i - 12]) / prices[i - 12] * 100
            rois.append(roi)
        padded = [rois[0]] * 12 + rois if rois else [8.0] * len(prices)
        df["ROI"] = padded[:len(prices)]
        return df
