exports.getGoldTrend = (req, res) => {
  const data = [
    { month: "Nov", value: 1920 },
    { month: "Dec", value: 1935 },
    { month: "Jan", value: 1950 },
    { month: "Feb", value: 1925 },
    { month: "Mar", value: 1945 },
  ];

  res.status(200).json(data);
};

exports.getSp500Trend = (req, res) => {
  const data = [
    { month: "Jan", value: 4800 },
    { month: "Feb", value: 4950 },
    { month: "Mar", value: 5100 },
    { month: "Apr", value: 5050 },
    { month: "May", value: 5200 },
    { month: "Jun", value: 5350 },
  ];

  res.status(200).json(data);
};

exports.getRealEstateRoi = (req, res) => {
  const data = [
    { asset: "Downtown", roi: 8.5 },
    { asset: "Marina", roi: 7.2 },
    { asset: "Palm", roi: 6.8 },
  ];

  res.status(200).json(data);
};
