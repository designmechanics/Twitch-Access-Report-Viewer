import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid
} from 'recharts';
import { Box, BarChart3, Dot, TrendingUp, SlidersHorizontal, Sparkles, User } from 'lucide-react';
import { ChartStyle } from '../../types';
import { ThreeDVisualization, ChartDataPoint } from './ThreeDVisualization';
import { StreamerAvatar } from '../StreamerAvatar';

interface UnifiedSectionChartProps {
  data: ChartDataPoint[];
  title?: string;
  yAxisLabel?: string;
  defaultStyle?: ChartStyle;
  onStyleChange?: (style: ChartStyle) => void;
  height?: number;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
  allowToggle?: boolean;
  metricLabel?: string;
  showCategoryLegend?: boolean;
}

export const UnifiedSectionChart: React.FC<UnifiedSectionChartProps> = ({
  data,
  title,
  yAxisLabel = 'Value',
  defaultStyle = '3d',
  onStyleChange,
  height = 320,
  colorTheme = 'twitch',
  allowToggle = true,
  metricLabel,
  showCategoryLegend = true
}) => {
  const [currentStyle, setCurrentStyle] = useState<ChartStyle>(defaultStyle);

  useEffect(() => {
    setCurrentStyle(defaultStyle);
  }, [defaultStyle]);

  const handleStyleSelect = (style: ChartStyle) => {
    setCurrentStyle(style);
    if (onStyleChange) {
      onStyleChange(style);
    }
  };

  const getPrimaryColor = () => {
    switch (colorTheme) {
      case 'cyberpunk':
        return '#00f0ff';
      case 'emerald':
        return '#10b981';
      case 'amber':
        return '#f59e0b';
      case 'twitch':
      default:
        return '#9146FF';
    }
  };

  const getSecondaryColor = () => {
    switch (colorTheme) {
      case 'cyberpunk':
        return '#ff007f';
      case 'emerald':
        return '#34d399';
      case 'amber':
        return '#fbbf24';
      case 'twitch':
      default:
        return '#bf94ff';
    }
  };

  const primaryColor = getPrimaryColor();
  const secondaryColor = getSecondaryColor();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const targetName = point.streamer || point.channel || point.label || label;
      return (
        <div className="rounded-lg border border-white/15 bg-black/95 p-3 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[140px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/10">
            <StreamerAvatar channelName={targetName} className="w-6 h-6 rounded-md shadow-sm" />
            <span className="font-bold text-white text-sm truncate">{targetName}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[#bf94ff]">
            <span className="text-gray-400 text-[11px]">{metricLabel || yAxisLabel}:</span>
            <span className="font-bold text-white font-mono">{Number(payload[0].value).toLocaleString()}</span>
          </div>
          {point.category && (
            <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400 mt-1">
              <span>Category:</span>
              <span className="text-gray-300 truncate max-w-[100px]">{point.category}</span>
            </div>
          )}
          {point.date && (
            <p className="text-[10px] text-gray-500 mt-1 pt-1 border-t border-white/5">{point.date}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-white/10 bg-[#18181B] text-xs font-mono text-gray-500">
        No numeric records available to chart.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#18181B] p-4.5 space-y-3.5 select-none shadow-sm">
      {/* Header with Title & Style Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#9146FF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {title || 'Visual Telemetry & Trend Analytics'}
            </h3>
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
            {data.length} data points mapped &bull; Metric: {metricLabel || yAxisLabel}
          </p>
        </div>

        {allowToggle && (
          <div className="flex items-center bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => handleStyleSelect('3d')}
              title="3D WebGL Graphic"
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                currentStyle === '3d'
                  ? 'bg-[#9146FF] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Graphic</span>
            </button>

            <button
              onClick={() => handleStyleSelect('bar')}
              title="Bar Chart"
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                currentStyle === 'bar'
                  ? 'bg-[#9146FF] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>

            <button
              onClick={() => handleStyleSelect('scatter')}
              title="Dot Splatter"
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                currentStyle === 'scatter'
                  ? 'bg-[#9146FF] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Dot className="w-3.5 h-3.5" />
              <span>Dot Splatter</span>
            </button>

            <button
              onClick={() => handleStyleSelect('line')}
              title="Connect the Dots / Trend Line"
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                currentStyle === 'line'
                  ? 'bg-[#9146FF] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trend Line</span>
            </button>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full">
        {currentStyle === '3d' ? (
          <ThreeDVisualization
            data={data}
            title={title}
            yAxisLabel={yAxisLabel}
            type="bars"
            height={height}
            colorTheme={colorTheme}
          />
        ) : currentStyle === 'bar' ? (
          <div style={{ height: `${height}px` }} className="w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.ceil(data.length / 10) - 1}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : currentStyle === 'scatter' ? (
          <div style={{ height: `${height}px` }} className="w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  name="Label"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.ceil(data.length / 10) - 1}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  dataKey="value"
                  name="Value"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <ZAxis range={[60, 280]} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter name="Data Point" data={data} fill={secondaryColor} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: `${height}px` }} className="w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.ceil(data.length / 10) - 1}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={primaryColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  dot={{ r: 3, fill: secondaryColor, stroke: '#18181B', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#ffffff', stroke: primaryColor, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Streamer Avatar Descriptors Strip */}
      {showCategoryLegend && data && data.length > 0 && (
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider mr-1">
            <User className="w-3 h-3 text-[#9146FF]" />
            <span>Mapped Channels & Streamers:</span>
          </div>
          {data.slice(0, 10).map((pt, i) => {
            const streamerName = pt.streamer || pt.channel || pt.label;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full border border-white/10 text-[11px] text-gray-200 transition-colors shadow-sm"
              >
                <StreamerAvatar channelName={streamerName} className="w-4 h-4 rounded-full" />
                <span className="font-bold truncate max-w-[100px]">{streamerName}</span>
                <span className="text-[10px] font-mono text-[#bf94ff] pl-0.5">
                  ({typeof pt.value === 'number' ? pt.value.toLocaleString() : pt.value})
                </span>
              </div>
            );
          })}
          {data.length > 10 && (
            <span className="text-[10px] font-mono text-gray-500 pl-1">
              +{data.length - 10} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};
