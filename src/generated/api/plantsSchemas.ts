/**
 * Generated by @openapi-codegen
 *
 * @version 0.1.0
 */
export type BasicPlantInfoResponseModel = {
  plant: Plant;
  location: Location;
  last_watering: Watering | null;
  last_check: Check | null;
  outstanding_reminders: Reminder[];
  cover_photo: Photo | null;
  cover_photo_url: string | null;
  cover_photo_thumbnail_url: string | null;
  wetness_decay_per_day: string;
};

export type Check = {
  id?: string;
  /**
   * @format date-time
   */
  created_at?: string;
  /**
   * @format date-time
   */
  updated_at?: string;
  updated_hash?: string | null;
  user_id: string;
  plant_id: string;
  /**
   * @format date-time
   */
  check_date?: string;
  wetness_scale: string;
  notes?: string | null;
};

export type CreateCheckRequest = {
  /**
   * @format date-time
   */
  check_date?: string;
  wetness_scale: number | string;
  notes?: string | null;
};

export type CreateLocationRequest = {
  name: string;
  description?: string | null;
};

export type CreatePhotoRequest = {
  plant_id: string;
  /**
   * @format date-time
   */
  photo_date?: string;
  /**
   * @default false
   */
  cover_photo?: boolean;
  photo_type: string;
  notes?: string | null;
};

export type CreatePhotoResponseModel = {
  photo: Photo;
  upload_presigned_url: string;
};

export type CreatePlantRequest = {
  name: string;
  scientific_name: string;
  location_id: string;
  notes?: string | null;
  default_watering_interval_days?: number | null;
};

export type CreateReminderRequest = {
  plant_id: string;
  /**
   * @format date-time
   */
  reminder_date: string;
  reminder_type: ReminderTypes;
  notes: string | null;
};

export type CreateWateringRequest = {
  /**
   * @format date-time
   */
  watering_date?: string;
  saturation_scale: number | string;
  bottom_watered?: boolean | null;
  notes?: string | null;
};

export type FullPlantInfoResponseModel = {
  plant: Plant;
  location: Location;
  last_watering: Watering | null;
  last_check: Check | null;
  outstanding_reminders: Reminder[];
  cover_photo: Photo | null;
  cover_photo_url: string | null;
  cover_photo_thumbnail_url: string | null;
  wetness_decay_per_day: string;
  waterings: Watering[];
  checks: Check[];
  photos: Photo[];
};

export type HTTPValidationError = {
  detail?: ValidationError[];
};

export type ListPlantsResponseModel = {
  plants: BasicPlantInfoResponseModel[];
  archived_plants?: BasicPlantInfoResponseModel[];
  total: number;
};

export type Location = {
  id?: string;
  /**
   * @format date-time
   */
  created_at?: string;
  /**
   * @format date-time
   */
  updated_at?: string;
  updated_hash?: string | null;
  user_id: string;
  name: string;
  slug_name: string;
  description?: string | null;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LogoutResponse = {
  detail: string;
};

export type OutstandingRemindersResponseModel = {
  reminders: ReminderWithPlantInfo[];
  total: number;
};

export type Photo = {
  id?: string;
  /**
   * @format date-time
   */
  created_at?: string;
  /**
   * @format date-time
   */
  updated_at?: string;
  updated_hash?: string | null;
  user_id: string;
  plant_id: string;
  /**
   * @format date-time
   */
  photo_date?: string;
  /**
   * @default false
   */
  cover_photo?: boolean;
  cover_photo_as_of_date?: string | null;
  photo_type: string;
  notes?: string | null;
  /**
   * @default false
   */
  uploaded?: boolean;
};

export type Plant = {
  id?: string;
  /**
   * @format date-time
   */
  created_at?: string;
  /**
   * @format date-time
   */
  updated_at?: string;
  updated_hash?: string | null;
  user_id: string;
  name: string;
  scientific_name: string;
  location_id: string;
  notes?: string | null;
  /**
   * @default false
   */
  archived?: boolean;
  archived_at?: string | null;
  default_watering_interval_days?: number | null;
};

export type PlantPhotoWithPresignedUrl = {
  photo: Photo;
  presigned_url: string;
};

export type PlantPhotosResponseModel = {
  photos: PlantPhotoWithPresignedUrl[];
  total: number;
};

export type Reminder = {
  id?: string;
  /**
   * @format date-time
   */
  created_at?: string;
  /**
   * @format date-time
   */
  updated_at?: string;
  updated_hash?: string | null;
  user_id: string;
  plant_id: string;
  /**
   * @format date-time
   */
  reminder_date: string;
  reminder_type: ReminderTypes;
  /**
   * @default false
   */
  complete?: boolean;
  completed_date?: string | null;
  notes?: string | null;
};

export type ReminderTypes = "check" | "repot" | "prune";

export type ReminderWithPlantInfo = {
  reminder: Reminder;
  plant_info: BasicPlantInfoResponseModel;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UnauthorizedResponse = {
  detail: string;
};

export type UpdatePlantRequest = {
  name?: string | null;
  scientific_name?: string | null;
  location_id?: string | null;
  notes?: string | null;
  archived?: boolean | null;
  default_watering_interval_days?: number | null;
};

export type User = {
  id?: string;
  /**
   * @format date-time
   */
  created_at?: string;
  /**
   * @format date-time
   */
  updated_at?: string;
  updated_hash?: string | null;
  username: string;
  name: string;
};

export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type Watering = {
  id?: string;
  /**
   * @format date-time
   */
  created_at?: string;
  /**
   * @format date-time
   */
  updated_at?: string;
  updated_hash?: string | null;
  user_id: string;
  plant_id: string;
  /**
   * @format date-time
   */
  watering_date?: string;
  /**
   * @default 10.0
   */
  saturation_scale?: string;
  bottom_watered?: boolean | null;
  notes?: string | null;
};
