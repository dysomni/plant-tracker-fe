import { Chip } from "@nextui-org/react";
import {
  IconBellFilled,
  IconDropletFilled,
  IconRuler2,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { Check, Watering } from "../generated/api/plantsSchemas";

export const PlantLatestReminderBadge = ({
  latestReminder,
}: {
  latestReminder: dayjs.Dayjs | null;
}) => {
  if (!latestReminder) {
    return (
      <Chip
        color="danger"
        variant="solid"
        startContent={<IconBellFilled size={15} />}
      >
        No Reminders
      </Chip>
    );
  }

  return (
    <Chip
      color="primary"
      variant="solid"
      startContent={<IconBellFilled size={15} />}
    >
      Latest Reminder {latestReminder.fromNow()}
    </Chip>
  );
};

export const PlantWetnessBadge = ({
  lastCheck,
}: {
  lastCheck: Check | null;
}) => {
  const wetness = Number(lastCheck?.wetness_scale);
  const lastCheckDate = lastCheck ? dayjs(lastCheck?.check_date) : null;
  // if wetness is nan or undefined, it has never been checked
  if (isNaN(wetness) || !lastCheckDate) {
    return (
      <Chip
        color="default"
        variant="solid"
        startContent={<IconRuler2 size={15} />}
      >
        Unchecked
      </Chip>
    );
  }
  // wetness will always be from 0 to 10
  // 0 is dry, 10 is wet
  const wetnessColor =
    wetness > 5 ? "success" : wetness > 2 ? "warning" : "danger";
  return (
    <Chip
      color={wetnessColor}
      variant="solid"
      startContent={<IconRuler2 size={15} />}
    >
      {wetness}
      {lastCheckDate.fromNow()}
    </Chip>
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
        variant="solid"
        startContent={<IconDropletFilled size={15} />}
      >
        Unwatered
      </Chip>
    );
  }

  return (
    <Chip
      color="primary"
      variant="solid"
      startContent={<IconDropletFilled size={15} />}
    >
      {lastWateredDate.fromNow()}
    </Chip>
  );
};
