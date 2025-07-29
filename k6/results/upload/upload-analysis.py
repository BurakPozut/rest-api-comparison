import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import sys
from pathlib import Path
from matplotlib.gridspec import GridSpec

# Read platform argument
if len(sys.argv) < 2:
    print("Usage: python3 cpu_analysis.py <platform-folder>")
    print("Example: python3 cpu_analysis.py windows-server")
    sys.exit(1)

platform_folder = sys.argv[1]  # e.g., "windows-server"

# Use the argument in your path
base_path = Path(__file__).parent
print(f"Loading data from {platform_folder}")
node_files = sorted(base_path.glob(f"{platform_folder}/upload-test-node-*.csv"))
asp_files = sorted(base_path.glob(f"{platform_folder}/upload-test-asp-*.csv"))

def load_runs(files, platform_label):
    df_list = []
    for i, file in enumerate(files):
        df = pd.read_csv(file)
        df["platform"] = platform_label
        df["run"] = i + 1
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
        df["elapsed"] = (df["timestamp"] - df["timestamp"].min()).dt.total_seconds()
        df_list.append(df)
    return pd.concat(df_list, ignore_index=True)

# Load and merge
df_node = load_runs(node_files, "node")
df_asp = load_runs(asp_files, "asp")
df_all = pd.concat([df_node, df_asp], ignore_index=True)

# Latency data
df_latency = df_all[df_all["metric_name"] == "http_req_duration"].copy()

# Error rate data
df_errors = df_all[df_all["metric_name"] == "http_req_failed"].copy()
error_rate = df_errors.groupby("platform")["metric_value"].mean().mul(100).round(2)

# Summary statistics (latency)
summary_latency = df_latency.groupby("platform")["metric_value"].agg(
    count="count",
    mean="mean",
    std="std",
    min="min",
    max="max",
    p95=lambda x: x.quantile(0.95),
    p99=lambda x: x.quantile(0.99),
).round(2)

# Merge error rate into summary
summary_latency["error_rate(%)"] = error_rate

print("\n--- Summary Statistics (/api/upload) ---")
print(summary_latency)

# Format with thousands separators
formatted_latency = summary_latency.reset_index()
for col in formatted_latency.columns[1:]:  # skip 'platform'
    formatted_latency[col] = formatted_latency[col].map(lambda x: f"{x:,.2f}" if isinstance(x, float) else f"{x:,}")

# Plot setup
sns.set(style="whitegrid")
fig = plt.figure(figsize=(13, 8))
gs = GridSpec(2, 1, height_ratios=[3, 1])
ax1 = plt.subplot(gs[0])
ax2 = plt.subplot(gs[1])

# Custom palette
custom_palette = {
    "asp": "#512bd4",   # ASP.NET
    "node": "#68a063",  # Node.js
}

# Latency line plot
sns.lineplot(
    data=df_latency,
    x="elapsed",
    y="metric_value",
    hue="platform",
    palette=custom_palette,
    estimator="mean",
    errorbar="sd",
    ax=ax1
)

# Phase markers
ax1.axvline(x=30, color='gray', linestyle='--', linewidth=1)
ax1.axvline(x=90, color='gray', linestyle='--', linewidth=1)
y_top = ax1.get_ylim()[1] * 0.97
ax1.text(15, y_top, 'Ramp-up', ha='center', fontsize=10, color='gray')
ax1.text(60, y_top, 'Steady Load', ha='center', fontsize=10, color='gray')
ax1.text(105, y_top, 'Ramp-down', ha='center', fontsize=10, color='gray')

# Labels and title
ax1.set_title(
    f"Latency Over Time - /api/upload (100 VUs, 5 Run Avg) - Test Environment: {platform_folder}",
    fontsize=14
)
ax1.set_xlabel("Elapsed Time (s)")
ax1.set_ylabel("Latency (ms)")
ax1.legend(title="Platform")

# Table with labeled units and formatted numbers
column_labels = [
    "Platform",
    "Count",
    "Mean (ms)",
    "Std Dev (ms)",
    "Min (ms)",
    "Max (ms)",
    "p95 (ms)",
    "p99 (ms)",
    "Error Rate (%)"
]

ax2.axis("off")
tbl = ax2.table(
    cellText=formatted_latency.values,
    colLabels=column_labels,
    cellLoc='center',
    loc='center'
)
tbl.auto_set_font_size(False)
tbl.set_fontsize(10)
tbl.scale(1.1, 1.5)

# Finalize
plt.tight_layout()
plt.savefig(f"results/upload/{platform_folder}/upload-latency-detailed-{platform_folder}.png", dpi=300)
plt.show()