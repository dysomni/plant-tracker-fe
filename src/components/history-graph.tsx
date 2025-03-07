import React from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import { extent, bisector } from "@visx/vendor/d3-array";
import { Bounds } from "@visx/brush/lib/types";
import { Group } from "@visx/group";
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
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { Line, LinePath } from "@visx/shape";
import { GridColumns, GridRows } from "@visx/grid";
import { AxisBottom, AxisRight } from "@visx/axis";
import { Slider, Tab, Tabs } from "@heroui/react";

import { Check, Watering } from "../generated/api/plantsSchemas";

import { useMediaQueries } from "./responsive-hooks";

const checkAccessors = {
  xAccessor: (d: Check) => dayjs(d.check_date).toDate(),
  xBisector: bisector((d: Check) => dayjs(d.check_date).toDate()).left,
  xNumAccessor: (d: Check) => dayjs(d.check_date).toDate().getTime(),
  yAccessor: (d: Check) => Number(d.wetness_scale),
};

export const purple3 = "#a44afe";
export const background = "#e0e0e0";
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
};

export const MyChart = (props: {
  waterHistory: Watering[];
  checkHistory: Check[];
  wetnessDecayPerDay: number | string;
}) => {
  const { waterHistory, wetnessDecayPerDay } = props;

  const [dataRangeSelection, setDataRangeSelection] = useState<
    "alltime" | "year" | "3month" | "month"
  >("3month");
  const checkHistory = useMemo(() => {
    const now = dayjs();

    return props.checkHistory.filter((check) => {
      if (dataRangeSelection === "alltime") return true;
      const checkDate = dayjs(check.check_date);

      if (dataRangeSelection === "year")
        return checkDate.isAfter(now.subtract(1, "year"));
      else if (dataRangeSelection === "3month")
        return checkDate.isAfter(now.subtract(3, "month"));
      else if (dataRangeSelection === "month")
        return checkDate.isAfter(now.subtract(1, "month"));

      return false;
    });
  }, [props.checkHistory, dataRangeSelection]);
  const mediaQueries = useMediaQueries();

  const { parentRef, width, height } = useParentSize({
    debounceTime: 150,
  });

  const { tooltipData, tooltipLeft, tooltipTop, hideTooltip, showTooltip } =
    useTooltip();

  const marginBottom = 50;
  const marginLeft = 20;
  const marginRight = 40;
  const marginTop = 20;

  // const chartSeparation = mediaQueries["md"] ? 60 : mediaQueries["sm"] ? 45 : 0;
  // const brushHeight = mediaQueries["sm"] ? 70 : 10;
  const xRangeStart = marginLeft;
  const xRangeEnd = width - marginRight;
  const xRangeWidth = xRangeEnd - xRangeStart;

  const yRangeStart = marginTop;
  const yRangeEnd = height - marginBottom; //- brushHeight - chartSeparation;
  const yRangeHeight = yRangeEnd - yRangeStart;
  // const yBrushRangeStart = yRangeEnd + chartSeparation;

  // const brushRef = useRef<BaseBrush | null>(null);
  const [brushBounds, setBrushBounds] = useState<Bounds>({
    x0: dayjs(checkHistory[0]?.check_date).toDate().getTime(),
    x1: new Date().getTime(),
    y0: 0,
    y1: 10,
  });

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
    [xRangeStart, xRangeEnd, brushBounds],
  );
  const wetnessScale = useMemo(
    () =>
      scaleLinear({
        range: [yRangeHeight, 0],
        domain: [0, 10],
        nice: true,
      }),
    [yRangeEnd, yRangeStart],
  );
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xRangeWidth],
        domain: [
          extent(checkHistory, checkAccessors.xAccessor)[0],
          new Date(),
        ] as [Date, Date],
      }),
    [xRangeStart, xRangeEnd, checkHistory],
  );

  const handleTooltip = useCallback(
    (
      event:
        | React.TouchEvent<SVGRectElement>
        | React.MouseEvent<SVGRectElement>,
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
    [showTooltip, checkHistory, dateScale],
  );

  const labelSize = mediaQueries["md"] ? 18 : mediaQueries["sm"] ? 15 : 11;

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
      {checkHistory.length > 0 ? (
        <div
          ref={parentRef}
          className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] relative bg-slate-50 p-2 rounded-3xl shadow-xl"
          style={{ minWidth: marginLeft + marginRight + 5 + "px" }}
        >
          <svg className="relative" height={height} width={width}>
            <rect
              fill={background}
              height={yRangeHeight}
              rx={14}
              width={xRangeWidth}
              x={xRangeStart}
              y={yRangeStart}
            />

            <Group left={xRangeStart} top={yRangeStart}>
              <RectClipPath
                height={yRangeHeight}
                id="clip"
                width={xRangeWidth}
              />
              <LinePath<Check>
                clipPath="url(#clip)"
                curve={curveLinear}
                data={checkHistory}
                height={yRangeHeight}
                stroke={"green"}
                strokeWidth={2}
                width={xRangeWidth}
                x={(d) => dateScale(checkAccessors.xAccessor(d))}
                y={(d) => wetnessScale(checkAccessors.yAccessor(d))}
              />
              <GridRows
                height={yRangeHeight}
                scale={wetnessScale}
                stroke="grey"
                strokeOpacity={0.2}
                width={xRangeWidth}
              />
              <GridColumns
                height={yRangeHeight}
                numTicks={5}
                scale={dateScale}
                stroke="grey"
                strokeOpacity={0.2}
                width={xRangeWidth}
              />

              <AxisBottom
                numTicks={5}
                scale={dateScale}
                stroke={"black"}
                tickLabelProps={{
                  fill: "black",
                  fontSize: labelSize,
                  textAnchor: "middle",
                }}
                tickStroke={"black"}
                top={yRangeHeight}
              />
              <AxisRight
                left={xRangeWidth}
                scale={wetnessScale}
                stroke={"black"}
                tickLabelProps={() => ({
                  fill: "black",
                  fontSize: labelSize,
                  textAnchor: "start",
                })}
                tickStroke={"black"}
              />
              {waterHistory.map((water) => {
                const x = dateScale(dayjs(water.watering_date).toDate());

                return (
                  <React.Fragment key={water.id}>
                    <Line
                      clipPath="url(#clip)"
                      from={{ x: x, y: 0 }}
                      opacity={0.8}
                      pointerEvents="none"
                      stroke={"blue"}
                      strokeDasharray="5,2"
                      strokeWidth={2}
                      to={{ x: x, y: yRangeHeight }}
                    />
                    <svg
                      className="icon icon-tabler icons-tabler-filled icon-tabler-droplet"
                      fill="blue"
                      height="12"
                      viewBox="0 0 24 24"
                      width="12"
                      x={x - 6}
                      xmlns="http://www.w3.org/2000/svg"
                      y={yRangeHeight + 1}
                    >
                      <path d="M0 0h24v24H0z" fill="none" stroke="none" />
                      <path d="M10.708 2.372a2.382 2.382 0 0 0 -.71 .686l-4.892 7.26c-1.981 3.314 -1.22 7.466 1.767 9.882c2.969 2.402 7.286 2.402 10.254 0c2.987 -2.416 3.748 -6.569 1.795 -9.836l-4.919 -7.306c-.722 -1.075 -2.192 -1.376 -3.295 -.686z" />
                    </svg>
                  </React.Fragment>
                );
              })}

              <rect
                fill="transparent"
                height={yRangeHeight}
                rx={14}
                width={xRangeWidth}
                x={0}
                y={0}
                onMouseLeave={() => hideTooltip()}
                onMouseMove={handleTooltip}
                onTouchMove={handleTooltip}
                onTouchStart={handleTooltip}
              />
              {tooltipData && (
                <g>
                  <Line
                    from={{ x: tooltipLeft ?? 0, y: 0 }}
                    pointerEvents="none"
                    stroke={"black"}
                    strokeDasharray="5,2"
                    strokeWidth={2}
                    to={{ x: tooltipLeft ?? 0, y: yRangeHeight }}
                  />
                  <circle
                    cx={tooltipLeft ?? 0}
                    cy={(tooltipTop ?? 0) + 1}
                    fill="black"
                    fillOpacity={0.1}
                    pointerEvents="none"
                    r={4}
                    stroke="black"
                    strokeOpacity={0.1}
                    strokeWidth={2}
                  />
                  <circle
                    cx={tooltipLeft ?? 0}
                    cy={tooltipTop ?? 0}
                    fill={"black"}
                    pointerEvents="none"
                    r={4}
                    stroke="white"
                    strokeWidth={2}
                  />
                </g>
              )}
            </Group>
          </svg>
          {tooltipData && (
            <div>
              <TooltipWithBounds
                key={Math.random()}
                left={(tooltipLeft ?? 0) + 20}
                style={tooltipStyles}
                top={(tooltipTop ?? 0) - 12}
              >
                {`Wetness ${checkAccessors.yAccessor(tooltipData as Check)}`}
              </TooltipWithBounds>
              <Tooltip
                className="shadow-lg border-1"
                left={(tooltipLeft ?? 0) + 10}
                style={{
                  ...defaultStyles,
                  minWidth: 100,
                  textAlign: "center",
                  transform: "translateX(-50%)",
                }}
                top={yRangeEnd}
              >
                {dayjs(checkAccessors.xAccessor(tooltipData as Check)).format(
                  "YYYY-MM-DD h:mm A",
                )}
              </Tooltip>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full text-center italic min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-foreground-100 rounded-3xl">
          No data
        </div>
      )}
      <div className="flex flex-col px-4 py-2 items-center">
        {checkHistory.length > 0 ? (
          <Slider
            aria-label="Discrete slider"
            maxValue={brushDateScale.domain()[1].getTime() ?? 0}
            minValue={brushDateScale.domain()[0].getTime() ?? 0}
            step={1000000}
            value={[brushBounds.x0, brushBounds.x1]}
            onChange={(numbers) => {
              setBrushBounds({
                ...brushBounds,
                x0: (numbers as number[])[0],
                x1: (numbers as number[])[1],
              });
            }}
          />
        ) : null}
        <Tabs
          aria-label="data range selection"
          className="mt-2"
          selectedKey={dataRangeSelection}
          size={mediaQueries["sm"] ? "lg" : "sm"}
          onSelectionChange={(key) => setDataRangeSelection(key as any)}
        >
          <Tab key="month" title="Month" />
          <Tab key="3month" title="3 Months" />
          <Tab key="year" title="Year" />
          <Tab key="alltime" title="All Time" />
        </Tabs>
        <p className="text-xs sm:text-sm italic text-center pt-5">
          {wetnessDecayPerDay === 0
            ? "No wetness decay calculated"
            : `Wetness decays by ${Number(wetnessDecayPerDay).toFixed(1)} points per day`}
        </p>
        {wetnessDecayPerDay !== 0 ? (
          <p className="text-xs sm:text-sm italic text-center">
            Plant seems to dry out in{" "}
            {Math.ceil(9 / Number(wetnessDecayPerDay))} days
          </p>
        ) : null}
      </div>
    </div>
  );
};
