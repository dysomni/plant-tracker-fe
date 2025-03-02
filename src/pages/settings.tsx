import { Button, Card, Divider } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { UAParser } from "ua-parser-js";
import { IconBellCheck, IconDevices, IconTrash } from "@tabler/icons-react";

import {
  fetchCreateNotificationSubscriptionV1SubscriptionsPost,
  fetchDisableNotificationSubscriptionV1SubscriptionsSubscriptionIdDisablePost,
  fetchGetNotificationSubscriptionsV1SubscriptionsGet,
  GetNotificationSubscriptionsV1SubscriptionsGetResponse,
} from "../generated/api/plantsComponents";
import { usePageLoading } from "../components/page-loading";
import { useToast } from "../toast";

import DefaultLayout from "@/layouts/default";

const handleNoMatchingWithEndpoint = async (
  response: GetNotificationSubscriptionsV1SubscriptionsGetResponse | undefined,
  setSubscriptionEndpoint: (val: string) => void,
) => {
  if (!response) {
    return;
  }
  const matchingSubscription = response.find(
    (subscription) => subscription.matching,
  );

  if (!matchingSubscription) {
    navigator.serviceWorker.ready?.then(async (registration) => {
      const subscription = await registration?.pushManager?.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setSubscriptionEndpoint("");
      }
    });
  }
};

export default function SettingsPage() {
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState("");
  const [data, setData] = useState<
    GetNotificationSubscriptionsV1SubscriptionsGetResponse | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const fetch = async (subscriptionEndpointOverride?: string) => {
    const endpoint = subscriptionEndpointOverride ?? subscriptionEndpoint;

    setIsLoading(true);
    const response = await fetchGetNotificationSubscriptionsV1SubscriptionsGet({
      queryParams: {
        subscription_endpoint: endpoint,
      },
    });

    setData(response);
    setIsLoading(false);

    return response;
  };

  const [notificationsAllowed, setNotificationsAllowed] = useState(false);

  usePageLoading(isLoading);

  const deviceDescription = useMemo(() => {
    const results = UAParser();
    const itemList = [
      results.device.vendor,
      results.device.model,
      results.os.name,
      results.os.version,
      results.browser.name,
    ];

    return itemList.filter((item) => !!item).join(" ");
  }, []);

  useEffect(() => {
    navigator.serviceWorker.ready?.then((registration) => {
      registration?.pushManager
        ?.permissionState({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
        })
        ?.then((result) => {
          if (result === "granted") {
            setNotificationsAllowed(true);
          }
        });
      registration.pushManager.getSubscription().then(async (subscription) => {
        if (subscription) {
          setSubscriptionEndpoint(subscription.endpoint);
          const response = await fetch(subscription.endpoint);

          await handleNoMatchingWithEndpoint(response, setSubscriptionEndpoint);
        } else {
          await fetch();
        }
      });
    });
  }, []);

  const toast = useToast();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-0 md:py-10 w-full">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-row items-center gap-2">
            <IconDevices size={20} />
            <h2 className="text-2xl font-semibold">Notification Devices</h2>
          </div>
          {!data || data.length === 0 ? (
            <div className="italic">
              No devices registered for notifications.
            </div>
          ) : null}
          {(data ?? []).map((subscription) => (
            <Card
              key={subscription.id}
              className="flex gap-2 p-4 w-full font-bold dark:border-2 dark:border-neutral-700"
            >
              {subscription.matching ? (
                <div className="text-success">Current Device</div>
              ) : null}
              <div className="text-nowrap overflow-x-hidden">
                {subscription.device_name}
              </div>
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row flex-wrap gap-3 gap-y-0 items-center">
                  <div className="text-sm">
                    Created <b>{dayjs(subscription.created_at).fromNow()}</b>
                  </div>
                  <div className="text-xs">
                    <i>
                      (
                      {dayjs(subscription.created_at).format(
                        "YYYY-MM-DD hh:mm A",
                      )}
                      )
                    </i>
                  </div>
                </div>
                <Button
                  className="self-end w-32"
                  size="sm"
                  startContent={<IconTrash size={20} />}
                  onPress={async () => {
                    if (subscription.matching) {
                      const registration = await navigator.serviceWorker.ready;
                      const subscription =
                        await registration?.pushManager?.getSubscription();

                      if (subscription) {
                        await subscription.unsubscribe();
                        setSubscriptionEndpoint("");
                      }
                    }

                    await fetchDisableNotificationSubscriptionV1SubscriptionsSubscriptionIdDisablePost(
                      {
                        pathParams: {
                          subscriptionId: subscription.id,
                        },
                      },
                    );
                    await fetch();
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <Divider />
        {isLoading || (notificationsAllowed && subscriptionEndpoint) ? null : (
          <Button
            color="primary"
            size="md"
            startContent={<IconBellCheck size={20} />}
            onPress={async () => {
              Notification.requestPermission().then(async (result) => {
                if (result === "granted") {
                  const registration = await navigator.serviceWorker.ready;

                  const pm = await registration?.pushManager?.permissionState({
                    userVisibleOnly: true,
                    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
                  });

                  if (pm === "granted") {
                    setNotificationsAllowed(true);
                    if (!subscriptionEndpoint) {
                      setIsLoading(true);
                      try {
                        const subscription =
                          await registration?.pushManager?.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: import.meta.env
                              .VITE_VAPID_PUBLIC_KEY,
                          });

                        await fetchCreateNotificationSubscriptionV1SubscriptionsPost(
                          {
                            body: {
                              subscription: subscription,
                              device_name: deviceDescription,
                            },
                          },
                        );
                        setSubscriptionEndpoint(subscription.endpoint);
                        await fetch(subscription.endpoint);
                      } catch (error) {
                        setIsLoading(false);
                        toast({
                          message: `Failed to subscribe to notifications. ${error}`,
                          type: "danger",
                          duration: 5000,
                        });
                      }
                    }
                  }
                  toast({
                    message: "Notifications enabled.",
                    type: "success",
                    duration: 5000,
                  });
                } else {
                  setNotificationsAllowed(false);
                  toast({
                    message: "Notifications failed to enable.",
                    type: "danger",
                    duration: 5000,
                  });
                }
              });
            }}
          >
            Enable Notifications For This Device
          </Button>
        )}
        {notificationsAllowed && (
          <Button
            size="sm"
            onPress={async () => {
              const options = {
                body: `You have 4 plants that need watering today.`,
                title: `Time to water your plants!`,
                icon: "/apple-touch-icon.png",
                actions: [
                  {
                    action: "open",
                    title: "Open the app",
                  },
                ],
              };

              const registration = await navigator.serviceWorker.ready;

              await registration?.showNotification(options.title, options);
            }}
          >
            Test Local Notification
          </Button>
        )}
      </section>
    </DefaultLayout>
  );
}
