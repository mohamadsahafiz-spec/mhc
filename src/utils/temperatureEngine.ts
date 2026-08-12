import {
  ParsedTempPoint,
  ParseOptions,
  ResampleOptions,
  ChannelDataMap,
  DayBoundary,
  ChannelStats,
  TemperatureAnalysisResult,
  ChartDataset
} from '../types/temperature';

export const TemperatureEngine = {
  /**
   * Parse raw .log / .txt text into individual temperature data points.
   * Preserves exact logic from Temperature Log Chart Generator.
   */
  parseLog(text: string, options?: ParseOptions): ParsedTempPoint[] {
    const lines = text.split(/\r?\n/);
    const records: ParsedTempPoint[] = [];
    const cmdNo = options?.cmdFilter !== undefined ? String(options.cmdFilter).trim() : '1';
    const filterMin = options?.filterMin ?? 0;
    const filterMax = options?.filterMax ?? 9999;

    let currentTime: Date | null = null;

    for (const line of lines) {
      // Extract timestamp in YYYY-MM-DD HH:mm:ss format
      const tMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
      if (tMatch) {
        currentTime = new Date(tMatch[1].replace(' ', 'T'));
      }

      if (!line.includes('Recv>>')) continue;

      // Handle both "Commnad No:" typo and "Command No:" standard spelling
      if (cmdNo && !line.includes(`Commnad No: ${cmdNo}`) && !line.includes(`Command No: ${cmdNo}`)) {
        continue;
      }

      // Extract station/channel number (1 to 6)
      const chMatch = line.match(/Station No:\s*(\d+)/i) || line.match(/(?:Station|Channel)\s*[:\s]*(\d+)/i);
      // Extract raw read data value
      const valMatch = line.match(/Read Data Value:\s*([0-9.]+)/i);

      if (chMatch && valMatch && currentTime) {
        const ch = parseInt(chMatch[1], 10);
        const rawVal = parseFloat(valMatch[1]);
        // Raw ÷ 10 → °C (e.g. 230 → 23.0°C)
        const val = Math.round((rawVal / 10) * 10) / 10;

        if (ch >= 1 && ch <= 6 && rawVal >= filterMin && rawVal <= filterMax) {
          records.push({
            ts: new Date(currentTime),
            ch,
            val,
            rawVal
          });
        }
      }
    }

    return records;
  },

  /**
   * Resamples records into configurable time interval buckets (e.g. 10s, 30s, 60s).
   * Calculates bucket averages rounded to 1 decimal place.
   */
  resampleData(records: ParsedTempPoint[], intervalSec: number = 30): ChannelDataMap {
    const byChannel: Record<number, ParsedTempPoint[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    records.forEach((r) => {
      if (byChannel[r.ch]) {
        byChannel[r.ch].push(r);
      }
    });

    const result: ChannelDataMap = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const stepMs = intervalSec * 1000;

    Object.entries(byChannel).forEach(([chStr, pts]) => {
      const ch = parseInt(chStr, 10);
      if (!pts.length) {
        result[ch] = [];
        return;
      }

      pts.sort((a, b) => a.ts.getTime() - b.ts.getTime());
      const buckets = new Map<number, { sum: number; count: number; ts: Date }>();

      pts.forEach((p) => {
        const key = Math.round(p.ts.getTime() / stepMs);
        if (!buckets.has(key)) {
          buckets.set(key, { sum: 0, count: 0, ts: new Date(key * stepMs) });
        }
        const b = buckets.get(key)!;
        b.sum += p.val;
        b.count++;
      });

      result[ch] = Array.from(buckets.values())
        .sort((a, b) => a.ts.getTime() - b.ts.getTime())
        .map((b) => ({
          ts: b.ts,
          val: Math.round((b.sum / b.count) * 10) / 10
        }));
    });

    return result;
  },

  /**
   * Detects day boundaries (00:00:00 midnight) for multi-day log analysis.
   */
  getDayBoundaries(records: ParsedTempPoint[]): DayBoundary[] {
    if (!records.length) return [];
    const dates = new Set<string>();
    records.forEach((r) => {
      dates.add(r.ts.toISOString().slice(0, 10));
    });

    const sortedDates = Array.from(dates).sort();
    return sortedDates.slice(1).map((d) => ({
      date: d,
      ts: new Date(`${d}T00:00:00`)
    }));
  },

  /**
   * Calculates statistics (min, max, avg, range, points) for an array of points.
   */
  calcStats(points: Array<{ val: number }>): ChannelStats | null {
    if (!points || !points.length) return null;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    points.forEach((p) => {
      if (p.val < min) min = p.val;
      if (p.val > max) max = p.val;
      sum += p.val;
    });

    const count = points.length;
    const avg = Math.round((sum / count) * 10) / 10;
    const minRound = Math.round(min * 10) / 10;
    const maxRound = Math.round(max * 10) / 10;
    const range = Math.round((maxRound - minRound) * 10) / 10;

    return {
      min: minRound,
      max: maxRound,
      avg,
      range,
      points: count
    };
  },

  /**
   * Calculates statistics map for each channel 1-6.
   */
  calcChannelStatsMap(channelData: ChannelDataMap): Record<number, ChannelStats> {
    const statsMap: Record<number, ChannelStats> = {};
    for (let ch = 1; ch <= 6; ch++) {
      const pts = channelData[ch] || [];
      const st = this.calcStats(pts);
      if (st) {
        statsMap[ch] = st;
      }
    }
    return statsMap;
  },

  /**
   * Calculates combined statistics across selected channels or channelDataMap.
   */
  calcCombinedStats(channelData: ChannelDataMap, activeChannels: number[] = [1, 2, 3, 4, 5, 6]): ChannelStats | null {
    const combinedPoints: Array<{ val: number }> = [];
    activeChannels.forEach((ch) => {
      const pts = channelData[ch] || [];
      pts.forEach((p) => combinedPoints.push(p));
    });
    return this.calcStats(combinedPoints);
  },

  /**
   * Alias for calcCombinedStats to handle global statistics calculation safely.
   */
  calculateGlobalStats(channelData: ChannelDataMap): ChannelStats {
    const stats = this.calcCombinedStats(channelData);
    return stats || { min: 0, max: 0, avg: 0, range: 0, points: 0 };
  },

  /**
   * Downsamples a channel point array to maxPoints using Min-Max bucket sampling to preserve peaks & valleys.
   */
  downsamplePoints(pts: Array<{ ts: Date | string; val: number }>, maxPoints: number = 1500): Array<{ ts: Date; val: number }> {
    if (!pts) return [];
    const toDatePt = (p: { ts: Date | string; val: number }): { ts: Date; val: number } => ({
      ts: p.ts instanceof Date ? p.ts : new Date(p.ts),
      val: p.val
    });
    if (pts.length <= maxPoints) {
      return pts.map(toDatePt);
    }
    const total = pts.length;
    const factor = Math.ceil(total / maxPoints);
    const result: Array<{ ts: Date; val: number }> = [];

    for (let i = 0; i < total; i += factor) {
      const end = Math.min(i + factor, total);
      let minPt = pts[i];
      let maxPt = pts[i];
      let minIdx = i;
      let maxIdx = i;

      for (let j = i + 1; j < end; j++) {
        const cur = pts[j];
        if (cur.val < minPt.val) {
          minPt = cur;
          minIdx = j;
        }
        if (cur.val > maxPt.val) {
          maxPt = cur;
          maxIdx = j;
        }
      }

      if (minIdx <= maxIdx) {
        result.push(toDatePt(minPt));
        if (minIdx !== maxIdx) result.push(toDatePt(maxPt));
      } else {
        result.push(toDatePt(maxPt));
        if (minIdx !== maxIdx) result.push(toDatePt(minPt));
      }
    }

    return result;
  },

  /**
   * Generates chart-ready dataset objects for visualization engines.
   */
  generateChartDatasets(channelData: ChannelDataMap, activeChannels: number[] = [1, 2, 3, 4, 5, 6]): ChartDataset[] {
    return [1, 2, 3, 4, 5, 6]
      .filter((ch) => activeChannels.includes(ch))
      .map((ch) => ({
        label: `CH${ch}`,
        channel: ch,
        data: (channelData[ch] || []).map((p) => ({ x: p.ts, y: p.val }))
      }));
  },

  /**
   * Full pipeline helper: parses raw text logs, resamples, computes boundaries & statistics.
   */
  analyzeTemperatureLogs(
    rawTexts: string[],
    options?: ParseOptions & ResampleOptions
  ): TemperatureAnalysisResult {
    let allRecords: ParsedTempPoint[] = [];

    rawTexts.forEach((text) => {
      const records = this.parseLog(text, options);
      allRecords = allRecords.concat(records);
    });

    allRecords.sort((a, b) => a.ts.getTime() - b.ts.getTime());

    const resampledChannels = this.resampleData(allRecords, options?.intervalSec ?? 30);
    const dayBoundaries = this.getDayBoundaries(allRecords);
    const channelStats = this.calcChannelStatsMap(resampledChannels);
    const combinedStats = this.calcCombinedStats(resampledChannels);

    const timeRange = allRecords.length > 0
      ? { start: allRecords[0].ts, end: allRecords[allRecords.length - 1].ts }
      : null;

    return {
      rawRecords: allRecords,
      resampledChannels,
      dayBoundaries,
      channelStats,
      combinedStats,
      timeRange
    };
  }
};
