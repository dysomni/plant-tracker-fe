import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Form,
  Input,
  Textarea,
} from "@heroui/react";
import { debounce } from "lodash";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { IconInfoCircle, IconPlus, IconSparkles } from "@tabler/icons-react";
import { Link } from "@heroui/link";

import { useAuthErrorRedirect } from "../auth";
import { unwrap } from "../util";
import {
  fetchCreateLocationV1LocationsPost,
  fetchCreatePlantV1PlantsPost,
  fetchSuggestScientificNameV1GenaiSuggestScientificNamePost,
  fetchUpdatePlantV1PlantsPlantIdPatch,
  useListAllLocationsV1LocationsGet,
} from "../generated/api/plantsComponents";
import {
  Plant,
  SuggestScientificNameResponse,
} from "../generated/api/plantsSchemas";

import { usePageLoading } from "./page-loading";

export const createPlantSchema = z.object({
  name: z.string().min(1),
  scientific_name: z.string().min(1),
  location_id: z.string().min(1),
  notes: z.string(),
  default_watering_interval_days: z.number().nullable(),
  important: z.boolean().optional(),
});

export const CreatePlantDrawer = (props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onPlantCreated?: () => Promise<void>;
  editPlant?: Plant;
}) => {
  const { open, setOpen, onPlantCreated, editPlant } = props;

  const [validationErrors, setValidationErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formState, setFormState] = useState<{
    name: string;
    scientific_name: string;
    location_id: string;
    notes: string;
    default_watering_interval_days: number | null;
    important?: boolean;
  }>({
    name: "",
    scientific_name: "",
    location_id: "",
    notes: "",
    default_watering_interval_days: null,
    important: false,
  });
  const [delayedName, setDelayedName] = useState("");
  const debouncedSetDelayedName = useCallback(
    debounce(setDelayedName, 500),
    [],
  );
  const [aiSuggestion, setAiSuggestion] =
    useState<SuggestScientificNameResponse | null>(null);

  useEffect(() => {
    if (!open) {
      setFormState({
        name: "",
        scientific_name: "",
        location_id: "",
        notes: "",
        default_watering_interval_days: null,
        important: false,
      });
      setDelayedName("");
      setAiSuggestion(null);
      setValidationErrors({});
    } else {
      setFormState({
        name: editPlant?.name || "",
        scientific_name: editPlant?.scientific_name || "",
        location_id: editPlant?.location_id || "",
        notes: editPlant?.notes || "",
        default_watering_interval_days:
          editPlant?.default_watering_interval_days || null,
        important: editPlant?.important || false,
      });
      setDelayedName(editPlant?.name || "");
    }
  }, [open, editPlant]);

  const {
    data: locationData,
    isFetching,
    error,
    refetch,
  } = useListAllLocationsV1LocationsGet({});

  useAuthErrorRedirect(error);

  useEffect(() => {
    if (!delayedName.trim()) {
      setAiSuggestion(null);

      return;
    }

    fetchSuggestScientificNameV1GenaiSuggestScientificNamePost({
      body: {
        given_name: delayedName.trim(),
        existing_scientific_name: formState.scientific_name || undefined,
      },
    })
      .then((response) => {
        setAiSuggestion(response);
      })
      .catch(() => {
        setAiSuggestion(null);
      });
  }, [delayedName]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = formState;
    const result = createPlantSchema.safeParse(data);

    if (!result.success) {
      setValidationErrors(result.error.flatten().fieldErrors);

      return;
    }

    if (!locationData?.map((l) => l.id).includes(result.data.location_id)) {
      setValidationErrors({
        location_id: "Location not saved yet.",
      });

      return;
    }

    setSubmitLoading(true);
    try {
      if (editPlant) {
        // Update plant
        await fetchUpdatePlantV1PlantsPlantIdPatch({
          body: result.data,
          pathParams: { plantId: unwrap(editPlant.id) },
        });
      } else {
        await fetchCreatePlantV1PlantsPost({
          body: result.data,
        });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: `Failed to ${editPlant ? "update" : "create"} plant.`,
        color: "danger",
      });
      setSubmitLoading(false);

      return;
    }

    addToast({
      title: "Success",
      description: `Plant ${editPlant ? "updated" : "created"} successfully.`,
      color: "success",
    });
    setSubmitLoading(false);
    await onPlantCreated?.();
    setOpen(false);
  };

  return (
    <Drawer
      isDismissable={false}
      isOpen={open}
      placement="right"
      size="2xl"
      onClose={() => setOpen(false)}
    >
      <Form
        autoComplete="off"
        validationErrors={validationErrors}
        onSubmit={handleSubmit}
      >
        <DrawerContent>
          {isFetching || submitLoading ? (
            <div className="flex absolute top-0 bottom-0 left-0 right-0 justify-center items-center bg-black z-50 opacity-30">
              <CircularProgress />
            </div>
          ) : null}
          <DrawerHeader>Create a New Plant</DrawerHeader>
          <DrawerBody>
            <Input
              isRequired
              description="This is how the plant will appear across the app."
              label="Plant Name"
              name="name"
              value={formState.name}
              onValueChange={(name) => {
                setFormState((prev) => ({ ...prev, name }));
                debouncedSetDelayedName(name);
              }}
            />
            <div className="flex flex-col gap-1">
              <Input
                isRequired
                description="The scientific name of the plant."
                label="Scientific Name"
                name="scientific_name"
                value={formState.scientific_name}
                onValueChange={(scientific_name) =>
                  setFormState((prev) => ({ ...prev, scientific_name }))
                }
              />
              <div
                className={`flex flex-col gap-1 pb-2 ${!aiSuggestion || !aiSuggestion.suggestions.length ? "hidden" : ""}`}
              >
                {aiSuggestion?.suggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="flex flex-row gap-1 items-center"
                  >
                    <Input
                      color="secondary"
                      endContent={
                        <div className="flex flex-row gap-1">
                          <Button
                            isIconOnly
                            aria-label="Use this suggestion"
                            color="secondary"
                            size="sm"
                            onPress={() => {
                              setFormState((prev) => ({
                                ...prev,
                                scientific_name: suggestion,
                              }));
                              setAiSuggestion(null);
                            }}
                          >
                            <IconPlus size={18} />
                          </Button>
                          <Button
                            isIconOnly
                            aria-label="View this suggestion on Google"
                            color="secondary"
                            size="sm"
                            onPress={() => {
                              window.open(
                                `https://www.google.com/search?q=${suggestion}`,
                                "_blank",
                              );
                            }}
                          >
                            <IconInfoCircle size={18} />
                          </Button>
                        </div>
                      }
                      label="Scientific Name Suggestion"
                      size="sm"
                      startContent={<IconSparkles size={18} />}
                      value={suggestion}
                    />
                  </div>
                ))}
              </div>
            </div>
            <LocationPicker
              value={formState.location_id}
              onChange={(location_id) =>
                setFormState((prev) => ({ ...prev, location_id }))
              }
              onLocationCreated={async () => {
                refetch({});
              }}
            />
            <Textarea
              description="Any additional care details, thoughts, etc."
              label="Notes"
              name="notes"
              value={formState.notes}
              onValueChange={(notes) =>
                setFormState((prev) => ({ ...prev, notes }))
              }
            />
            <Input
              description="The default number of days between waterings. Set to 0 to reset."
              label="Default Watering Interval (Days)"
              name="default_watering_interval_days"
              type="number"
              value={formState.default_watering_interval_days?.toString() || ""}
              onValueChange={(default_watering_interval_days) =>
                setFormState((prev) => ({
                  ...prev,
                  default_watering_interval_days: default_watering_interval_days
                    ? +default_watering_interval_days
                    : null,
                }))
              }
            />
            <Checkbox
              isSelected={formState.important}
              name="important"
              onValueChange={(important) =>
                setFormState((prev) => ({ ...prev, important }))
              }
            >
              Important
            </Checkbox>
          </DrawerBody>
          <DrawerFooter>
            <Button size="lg" onPress={() => setOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" size="lg" type="submit">
              {editPlant ? "Update" : "Create"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Form>
    </Drawer>
  );
};

export const LocationPicker = (props: {
  value: string;
  onChange: (value: string) => void;
  onLocationCreated?: () => Promise<void>;
}) => {
  const { value, onChange, onLocationCreated } = props;
  const { data, isLoading, error, refetch } = useListAllLocationsV1LocationsGet(
    {},
  );

  usePageLoading(isLoading);
  useAuthErrorRedirect(error);

  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (value && !searchInput && data) {
      const location = data?.find((l) => l.id === value);

      setSearchInput(location?.name || "");
    }
  }, [value, data]);

  const handleCreate = async () => {
    const locationName = searchInput.trim();

    if (!locationName) {
      addToast({
        title: "Failed to save.",
        description: "Location name cannot be empty.",
        color: "warning",
      });

      return;
    }

    try {
      const location = await fetchCreateLocationV1LocationsPost({
        body: { name: locationName },
      });

      addToast({
        title: "Success",
        description: "Location created successfully.",
        color: "success",
      });
      await refetch();
      await onLocationCreated?.();
      onChange(unwrap(location.id).toString());
      setSearchInput(locationName);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to create location.",
        color: "danger",
      });

      return;
    }
  };

  return (
    <div className="flex flex-row gap-2">
      <Autocomplete
        allowsCustomValue
        isRequired
        autoComplete="off"
        defaultItems={data || []}
        description="The location where the plant is kept."
        endContent={
          isLoading ? (
            <CircularProgress
              aria-label="Loading..."
              color="primary"
              size="sm"
            />
          ) : (
            <Link
              className="cursor-pointer pr-1"
              size="sm"
              onPress={handleCreate}
            >
              <IconPlus size={15} />
              New
            </Link>
          )
        }
        inputValue={searchInput}
        isDisabled={isLoading || !data}
        label="Location"
        name="location_id"
        selectedKey={value}
        onBlur={async () => {
          if (!searchInput) return;
          const location = data
            ? data.find((l) => l.name === searchInput)
            : null;

          if (!location) {
            onChange(searchInput);
          }
        }}
        onInputChange={setSearchInput}
        onSelectionChange={(location_id) => {
          if (!location_id) return;
          onChange(location_id.toString());
          setSearchInput(
            (data || []).find((l) => l.id === location_id)?.name || "",
          );
        }}
      >
        {(location) => (
          <AutocompleteItem key={location.id}>{location.name}</AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  );
};
