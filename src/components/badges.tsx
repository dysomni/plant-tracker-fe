import { Chip, Tooltip } from "@nextui-org/react";
import {
  IconBellFilled,
  IconDropletFilled,
  IconRuler2,
} from "@tabler/icons-react";
import dayjs from "dayjs";

import { Check, Watering } from "../generated/api/plantsSchemas";
import { pluralize } from "../util";

export const ReminderlessPlantBadge = (props: { count: number }) => {
  const { count } = props;

  return (
    <Chip
      className="p-4"
      color="danger"
      startContent={<IconBellFilled size={15} />}
      variant="solid"
    >
      {count} {pluralize(count, "plant", "plants")} without reminders
    </Chip>
  );
};

export const PlantLatestReminderBadge = ({
  hasReminders,
}: {
  hasReminders: boolean;
}) => {
  if (!hasReminders) {
    return (
      <Chip
        color="danger"
        startContent={<IconBellFilled size={15} />}
        variant="solid"
      >
        No Reminders
      </Chip>
    );
  }

  return null;
};

export const wetnessToLabel = (wetness: number) => {
  const mapping = {
    0: "Bone Dry",
    1: "Dry",
    2: "Vaguely Damp",
    3: "Slightly Damp",
    4: "Damp",
    5: "Moist",
    6: "Very Moist",
    7: "Wet",
    8: "Very Wet",
    9: "Soaked",
    10: "Saturated",
  };

  if (wetness in mapping) {
    return mapping[wetness as keyof typeof mapping];
  } else {
    return "Unknown";
  }
};

export const PlantWetnessBadge = ({
  lastCheck,
  wetnessDecayPerDay,
}: {
  lastCheck: Check | null;
  wetnessDecayPerDay: number | string;
}) => {
  const wetness = Number(lastCheck?.wetness_scale);
  const lastCheckDate = lastCheck ? dayjs(lastCheck?.check_date) : null;

  // if wetness is nan or undefined, it has never been checked
  if (isNaN(wetness) || !lastCheckDate) {
    return (
      <Chip
        color="default"
        startContent={<IconRuler2 size={15} />}
        variant="flat"
      >
        Unchecked
      </Chip>
    );
  }
  // wetness will always be from 0 to 10
  // Calculate the decay in wetness based on the number of days since the last check
  const daysSinceLastCheck = dayjs().diff(lastCheckDate, "day");
  const decayedWetness = Math.max(
    0,
    wetness - daysSinceLastCheck * Number(wetnessDecayPerDay),
  );

  // 0 is dry, 10 is wet
  const wetnessColor =
    decayedWetness > 5 ? "primary" : decayedWetness > 2 ? "warning" : "danger";

  return (
    <Tooltip content={lastCheckDate.format("MMMM D, YYYY h:mm A")}>
      <Chip
        color={wetnessColor}
        variant="flat"
        startContent={<IconRuler2 size={15} />}
        // className="bg-danger-"
      >
        {wetnessToLabel(wetness)}&nbsp;
        {lastCheckDate.fromNow()}
      </Chip>
    </Tooltip>
  );
};

export const PlantWateringBadge = ({
  lastWatered,
}: {
  lastWatered: Watering | null;
}) => {
  const lastWateredDate = lastWatered ? dayjs(lastWatered.watering_date) : null;

  if (!lastWateredDate) {
    return (
      <Chip
        color="default"
        startContent={<IconDropletFilled size={15} />}
        variant="flat"
      >
        Unwatered
      </Chip>
    );
  }

  return (
    <Tooltip content={lastWateredDate.format("MMMM D, YYYY h:mm A")}>
      <Chip
        color="secondary"
        startContent={<IconDropletFilled size={15} />}
        variant="flat"
      >
        {lastWateredDate.fromNow()}
      </Chip>
    </Tooltip>
  );
};
