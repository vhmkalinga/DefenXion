"""
DefenXion – PCAP Deep Packet Inspection Engine
------------------------------------------------
Extracts CICIDS2017-compatible flow features from uploaded .pcap files
using Scapy, then runs them through the active ML model for classification.
"""

from collections import defaultdict
from datetime import datetime
import math


def _safe_mean(lst):
    return sum(lst) / len(lst) if lst else 0.0

def _safe_std(lst):
    if len(lst) < 2:
        return 0.0
    mean = _safe_mean(lst)
    return math.sqrt(sum((x - mean) ** 2 for x in lst) / len(lst))


def extract_features_from_pcap(pcap_bytes: bytes) -> list[dict]:
    """
    Parse a raw PCAP file from bytes.
    Groups packets into 5-tuple flows (src_ip, dst_ip, src_port, dst_port, proto).
    Extracts a 10-feature vector per flow that maps to CICIDS2017-style features.

    Returns a list of flow dicts, each with:
      - flow_id, src_ip, dst_ip, src_port, dst_port, protocol
      - features dict (ready to pass to the ML predictor)
    """
    try:
        from scapy.all import rdpcap, IP, TCP, UDP
        import tempfile, os

        # Write bytes to a temp file so Scapy can read it
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pcap") as tmp:
            tmp.write(pcap_bytes)
            tmp_path = tmp.name

        try:
            packets = rdpcap(tmp_path)
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        raise ValueError(f"Failed to parse PCAP file: {e}")

    # Group into flows
    flows = defaultdict(lambda: {
        "packets": [],
        "lengths": [],
        "timestamps": [],
        "tcp_flags": [],
        "src_ip": None, "dst_ip": None,
        "src_port": 0, "dst_port": 0,
        "protocol": "OTHER"
    })

    for pkt in packets:
        if not pkt.haslayer("IP"):
            continue
        ip = pkt["IP"]
        proto = "OTHER"
        src_port, dst_port = 0, 0
        flags = 0

        if pkt.haslayer("TCP"):
            proto = "TCP"
            tcp = pkt["TCP"]
            src_port = int(tcp.sport)
            dst_port = int(tcp.dport)
            flags = int(tcp.flags)
        elif pkt.haslayer("UDP"):
            proto = "UDP"
            udp = pkt["UDP"]
            src_port = int(udp.sport)
            dst_port = int(udp.dport)

        key = (ip.src, ip.dst, src_port, dst_port, proto)
        f = flows[key]
        f["src_ip"] = ip.src
        f["dst_ip"] = ip.dst
        f["src_port"] = src_port
        f["dst_port"] = dst_port
        f["protocol"] = proto
        f["lengths"].append(len(pkt))
        f["timestamps"].append(float(pkt.time))
        f["tcp_flags"].append(flags)

    results = []
    for i, (key, f) in enumerate(flows.items()):
        lengths = f["lengths"]
        ts = sorted(f["timestamps"])
        iats = [ts[j+1] - ts[j] for j in range(len(ts)-1)] if len(ts) > 1 else [0.0]

        # Build a feature vector using names that any trained RF model will have
        features = {
            "Destination Port":         float(f["dst_port"]),
            "Flow Duration":            float(max(ts) - min(ts)) * 1e6 if len(ts) > 1 else 0.0,
            "Total Fwd Packets":        float(len(lengths)),
            "Total Backward Packets":   0.0,
            "Total Length of Fwd Packets": float(sum(lengths)),
            "Fwd Packet Length Max":    float(max(lengths)),
            "Fwd Packet Length Min":    float(min(lengths)),
            "Fwd Packet Length Mean":   float(_safe_mean(lengths)),
            "Fwd Packet Length Std":    float(_safe_std(lengths)),
            "Flow Bytes/s":             float(sum(lengths) / (max(ts) - min(ts) + 1e-9)),
            "Flow Packets/s":           float(len(lengths) / (max(ts) - min(ts) + 1e-9)),
            "Flow IAT Mean":            float(_safe_mean(iats) * 1e6),
            "Flow IAT Std":             float(_safe_std(iats) * 1e6),
            "Flow IAT Max":             float(max(iats) * 1e6),
            "Flow IAT Min":             float(min(iats) * 1e6),
            "Fwd IAT Total":            float(sum(iats) * 1e6),
            "Fwd IAT Mean":             float(_safe_mean(iats) * 1e6),
            "Fwd IAT Std":              float(_safe_std(iats) * 1e6),
            "Fwd IAT Max":              float(max(iats) * 1e6),
            "Fwd IAT Min":              float(min(iats) * 1e6),
            "Bwd IAT Total":            0.0,
            "Bwd IAT Mean":             0.0,
            "Bwd IAT Std":              0.0,
            "Bwd IAT Max":              0.0,
            "Bwd IAT Min":              0.0,
            "Fwd PSH Flags":            0.0,
            "Bwd PSH Flags":            0.0,
            "Fwd URG Flags":            0.0,
            "Bwd URG Flags":            0.0,
            "Fwd Header Length":        float(len(lengths) * 20),
            "Bwd Header Length":        0.0,
            "Fwd Packets/s":            float(len(lengths) / (max(ts) - min(ts) + 1e-9)),
            "Bwd Packets/s":            0.0,
            "Min Packet Length":        float(min(lengths)),
            "Max Packet Length":        float(max(lengths)),
            "Packet Length Mean":       float(_safe_mean(lengths)),
            "Packet Length Std":        float(_safe_std(lengths)),
            "Packet Length Variance":   float(_safe_std(lengths) ** 2),
            "FIN Flag Count":           float(sum(1 for fl in f["tcp_flags"] if fl & 0x01)),
            "SYN Flag Count":           float(sum(1 for fl in f["tcp_flags"] if fl & 0x02)),
        }

        results.append({
            "flow_id":   i + 1,
            "src_ip":    f["src_ip"],
            "dst_ip":    f["dst_ip"],
            "src_port":  f["src_port"],
            "dst_port":  f["dst_port"],
            "protocol":  f["protocol"],
            "pkt_count": len(lengths),
            "features":  features,
        })

    return results
