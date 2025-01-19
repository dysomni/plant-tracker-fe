import { scaleTime, scaleLinear } from "@visx/scale";
import { Brush } from "@visx/brush";
import { extent, bisector } from "@visx/vendor/d3-array";
import { Bounds } from "@visx/brush/lib/types";
import BaseBrush from "@visx/brush/lib/BaseBrush";
import { Group } from "@visx/group";
import { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";
import {
  defaultStyles,
  useTooltip,
  TooltipWithBounds,
  Tooltip,
} from "@visx/tooltip";
import { curveLinear } from "@visx/curve";
import { RectClipPath } from "@visx/clip-path";
import { useParentSize } from "@visx/responsive";
import { localPoint } from "@visx/event";

import { Check, Watering } from "../generated/api/plantsSchemas";
import dayjs from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { Line, LinePath } from "@visx/shape";
import { GridColumns, GridRows } from "@visx/grid";
import { AxisBottom, AxisRight } from "@visx/axis";

const checkAccessors = {
  xAccessor: (d) => dayjs(d.check_date).toDate(),
  xBisector: bisector((d) => dayjs(d.check_date).toDate()).left,
  xNumAccessor: (d) => dayjs(d.check_date).toDate().getTime(),
  yAccessor: (d) => d.wetness_scale,
};

const purple1 = "#6c5efb";
const purple2 = "#c998ff";
export const purple3 = "#a44afe";
export const background = "#f9f9f9";
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
};

export const MyChart = (props: {
  waterHistory: Watering[];
  checkHistory: Check[];
}) => {
  const { waterHistory, checkHistory } = props;

  const { parentRef, width, height } = useParentSize({
    debounceTime: 150,
  });

  const { tooltipData, tooltipLeft, tooltipTop, hideTooltip, showTooltip } =
    useTooltip();

  const marginBottom = 20;
  const marginLeft = 20;
  const marginRight = 50;
  const marginTop = 20;

  const chartSeparation = 30;
  const brushHeight = 50;
  const xRangeStart = marginLeft;
  const xRangeEnd = width - marginRight;
  const xRangeWidth = xRangeEnd - xRangeStart;

  const yRangeStart = marginTop;
  const yRangeEnd = height - marginBottom - brushHeight - chartSeparation;
  const yRangeHeight = yRangeEnd - yRangeStart;
  const yBrushRangeStart = yRangeEnd + chartSeparation;

  const brushRef = useRef<BaseBrush | null>(null);
  const [filteredCheckHistory, setFilteredCheckHistory] =
    useState(checkHistory);
  const [brushBounds, setBrushBounds] = useState<Bounds>({
    x0: dayjs(checkHistory[0].check_date).toDate().getTime(),
    x1: dayjs(checkHistory[checkHistory.length - 1].check_date)
      .toDate()
      .getTime(),
    y0: 0,
    y1: 10,
  });

  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return;
    setBrushBounds(domain);
    const { x0, x1, y0, y1 } = domain;
    const copy = checkHistory.filter((s) => {
      const x = checkAccessors.xAccessor(s).getTime();
      const y = checkAccessors.yAccessor(s);
      return x > x0 && x < x1 && y > y0 && y < y1;
    });
    setFilteredCheckHistory(copy);
  };

  // scales
  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xRangeWidth],
        domain: [new Date(brushBounds.x0), new Date(brushBounds.x1)] as [
          Date,
          Date,
        ],
      }),
    [xRangeStart, xRangeEnd, filteredCheckHistory]
  );
  const wetnessScale = useMemo(
    () =>
      scaleLinear({
        range: [yRangeHeight, 0],
        domain: [0, 10],
        nice: true,
      }),
    [yRangeEnd, yRangeStart]
  );
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xRangeWidth],
        domain: extent(checkHistory, checkAccessors.xAccessor) as [Date, Date],
      }),
    [xRangeStart, xRangeEnd, checkHistory]
  );
  const brushWetnessScale = useMemo(
    () =>
      scaleLinear({
        range: [brushHeight, 0],
        domain: [0, 10],
        nice: true,
      }),
    [yRangeEnd, yRangeStart]
  );

  const initialBrushPosition = useMemo(
    () => ({
      start: {
        x: brushDateScale(checkAccessors.xAccessor(filteredCheckHistory[0])),
      },
      end: {
        x: brushDateScale(
          checkAccessors.xAccessor(
            filteredCheckHistory[filteredCheckHistory.length - 1]
          )
        ),
      },
    }),
    [brushDateScale]
  );

  const handleTooltip = useCallback(
    (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      const { x } = localPoint(event) || { x: 0 };
      const actualX = x - marginLeft;
      const x0 = dateScale.invert(actualX);

      const index = checkAccessors.xBisector(checkHistory, x0, 1);
      const d0 = checkHistory[index - 1];
      const d1 = checkHistory[index];
      let d = d0;
      if (d1 && checkAccessors.xAccessor(d1)) {
        d =
          x0.valueOf() - checkAccessors.xAccessor(d0).valueOf() >
          checkAccessors.xAccessor(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      const xPosition = dateScale(checkAccessors.xAccessor(d));
      showTooltip({
        tooltipData: d,
        tooltipLeft: xPosition,
        tooltipTop: wetnessScale(checkAccessors.yAccessor(d)),
      });
    },
    [showTooltip, checkHistory, dateScale]
  );

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs sm:text-sm px-4">
        <div className="flex flex-col">
          <p className="font-bold">
            {dayjs(brushBounds.x0).format("YYYY-MM-DD")}
          </p>
          <p>{dayjs(brushBounds.x0).fromNow()}</p>
        </div>
        <div className="flex flex-col text-right">
          <p className="font-bold">
            {dayjs(brushBounds.x1).format("YYYY-MM-DD")}
          </p>
          <p>{dayjs(brushBounds.x1).fromNow()}</p>
        </div>
      </div>
      <div
        ref={parentRef}
        className="w-full min-h-72 relative"
        style={{ minWidth: marginLeft + marginRight + 5 + "px" }}
      >
        <svg width={width} height={height} className="relative">
          <rect
            x={xRangeStart}
            y={yRangeStart}
            width={xRangeWidth}
            height={yRangeHeight}
            fill={background}
            rx={0}
          />

          <Group top={yRangeStart} left={xRangeStart}>
            <RectClipPath id="clip" width={xRangeWidth} height={yRangeHeight} />
            <LinePath<Check>
              data={checkHistory}
              width={xRangeWidth}
              height={yRangeHeight}
              x={(d) => dateScale(checkAccessors.xAccessor(d))}
              y={(d) => wetnessScale(checkAccessors.yAccessor(d))}
              stroke={"green"}
              strokeWidth={2}
              curve={curveLinear}
              clipPath="url(#clip)"
            />
            <GridRows
              scale={wetnessScale}
              width={xRangeWidth}
              height={yRangeHeight}
              stroke="grey"
              strokeOpacity={0.2}
            />
            <GridColumns
              scale={dateScale}
              height={yRangeHeight}
              width={xRangeWidth}
              stroke="grey"
              strokeOpacity={0.2}
              numTicks={5}
            />

            <AxisBottom
              top={yRangeHeight}
              scale={dateScale}
              stroke={"black"}
              tickStroke={"black"}
              tickLabelProps={{
                fill: "black",
                fontSize: 11,
                textAnchor: "middle",
              }}
              numTicks={5}
            />
            <AxisRight
              scale={wetnessScale}
              left={xRangeWidth}
              stroke={"black"}
              tickStroke={"black"}
              tickLabelProps={() => ({
                fill: "black",
                fontSize: 11,
                textAnchor: "middle",
              })}
            />
            {waterHistory.map((water) => {
              const x = dateScale(dayjs(water.watering_date).toDate());
              return (
                <>
                  <Line
                    from={{ x: x, y: 0 }}
                    to={{ x: x, y: yRangeHeight }}
                    stroke={"blue"}
                    strokeWidth={2}
                    pointerEvents="none"
                    strokeDasharray="5,2"
                    opacity={0.8}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="blue"
                    className="icon icon-tabler icons-tabler-filled icon-tabler-droplet"
                    x={x - 6}
                    y={yRangeHeight + 1}
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M10.708 2.372a2.382 2.382 0 0 0 -.71 .686l-4.892 7.26c-1.981 3.314 -1.22 7.466 1.767 9.882c2.969 2.402 7.286 2.402 10.254 0c2.987 -2.416 3.748 -6.569 1.795 -9.836l-4.919 -7.306c-.722 -1.075 -2.192 -1.376 -3.295 -.686z" />
                  </svg>
                </>
              );
            })}

            <rect
              x={0}
              y={0}
              width={xRangeWidth}
              height={yRangeHeight}
              fill="transparent"
              rx={14}
              onTouchStart={handleTooltip}
              onTouchMove={handleTooltip}
              onMouseMove={handleTooltip}
              onMouseLeave={() => hideTooltip()}
            />
            {tooltipData && (
              <g>
                <Line
                  from={{ x: tooltipLeft ?? 0, y: 0 }}
                  to={{ x: tooltipLeft ?? 0, y: yRangeHeight }}
                  stroke={"black"}
                  strokeWidth={2}
                  pointerEvents="none"
                  strokeDasharray="5,2"
                />
                <circle
                  cx={tooltipLeft ?? 0}
                  cy={(tooltipTop ?? 0) + 1}
                  r={4}
                  fill="black"
                  fillOpacity={0.1}
                  stroke="black"
                  strokeOpacity={0.1}
                  strokeWidth={2}
                  pointerEvents="none"
                />
                <circle
                  cx={tooltipLeft ?? 0}
                  cy={tooltipTop ?? 0}
                  r={4}
                  fill={"black"}
                  stroke="white"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              </g>
            )}
          </Group>
          <Group top={yBrushRangeStart} left={xRangeStart}>
            <RectClipPath
              id="brushClip"
              width={xRangeWidth}
              height={brushHeight}
            />
            <LinePath<Check>
              data={checkHistory}
              width={xRangeWidth}
              height={brushHeight}
              x={(d) => brushDateScale(checkAccessors.xAccessor(d))}
              y={(d) => brushWetnessScale(checkAccessors.yAccessor(d))}
              stroke={purple1}
              strokeWidth={2}
              curve={curveLinear}
              clipPath="url(#brushClip)"
            />
            <Brush
              xScale={brushDateScale}
              yScale={brushWetnessScale}
              width={xRangeWidth}
              height={brushHeight}
              handleSize={8}
              innerRef={brushRef}
              resizeTriggerAreas={["left", "right"]}
              brushDirection="horizontal"
              initialBrushPosition={initialBrushPosition}
              onChange={onBrushChange}
              selectedBoxStyle={{
                ...Brush.defaultProps.selectedBoxStyle,
                rx: 5,
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setFilteredCheckHistory(checkHistory);
              }}
              useWindowMoveEvents
              renderBrushHandle={(props) => <BrushHandle {...props} />}
            />
          </Group>
        </svg>
        {tooltipData && (
          <div>
            <TooltipWithBounds
              key={Math.random()}
              top={(tooltipTop ?? 0) - 12}
              left={(tooltipLeft ?? 0) + 20}
              style={tooltipStyles}
            >
              {`Wetness ${checkAccessors.yAccessor(tooltipData)}`}
            </TooltipWithBounds>
            <Tooltip
              top={yRangeEnd}
              left={(tooltipLeft ?? 0) + 10}
              className="shadow-lg border-1"
              style={{
                ...defaultStyles,
                minWidth: 100,
                textAlign: "center",
                transform: "translateX(-50%)",
              }}
            >
              {dayjs(checkAccessors.xAccessor(tooltipData)).format(
                "YYYY-MM-DD h:mm A"
              )}
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

// We need to manually offset the handles for them to be rendered at the right position
const BrushHandle = ({ x, height, isBrushActive }: BrushHandleRenderProps) => {
  const pathWidth = 8;
  const pathHeight = 15;
  if (!isBrushActive) {
    return null;
  }
  return (
    <Group left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <rect
        x={-4}
        y={-5}
        width={8}
        height={25}
        fill="#f2f2f2"
        stroke="#999999"
        strokeWidth="1"
        rx={2}
        ry={2}
        style={{ cursor: "ew-resize" }}
      />
      <line
        x1={-1}
        y1={4}
        x2={-1}
        y2={12}
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
      <line
        x1={1}
        y1={4}
        x2={1}
        y2={12}
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
    </Group>
  );
};