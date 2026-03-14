"use client";

import { useForm, FormProvider } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/providers/app-context-provider";
import { CreateRestaurantRequest, Photo } from "@/domain/domain";
import CreateRestaurantForm from "@/components/create-restaurant-form";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

type FormData = {
  name: string;
  cuisineType: string;
  contactInformation: string;
  address: {
    streetNumber: string;
    streetName: string;
    unit?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  operatingHours: {
    monday: { openTime: string; closeTime: string } | null;
    tuesday: { openTime: string; closeTime: string } | null;
    wednesday: { openTime: string; closeTime: string } | null;
    thursday: { openTime: string; closeTime: string } | null;
    friday: { openTime: string; closeTime: string } | null;
    saturday: { openTime: string; closeTime: string } | null;
    sunday: { openTime: string; closeTime: string } | null;
  };
  photos: string[];
};

export default function CreateRestaurantPage() {
  const { apiService } = useAppContext();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("id");

  const router = useRouter();

  const methods = useForm<FormData>({
    defaultValues: {
      name: "",
      cuisineType: "",
      contactInformation: "",
      address: {
        streetNumber: "",
        streetName: "",
        unit: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      operatingHours: {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
      },
      photos: [],
    },
  });

  useEffect(() => {
    const doUseEffect = async () => {
      if (!apiService) return;

      setLoading(true);
      setError(undefined);

      if (!restaurantId) {
        setError("Restaurant ID must be provided");
        setLoading(false);
        return;
      }

      try {
        const restaurant = await apiService.getRestaurant(restaurantId);

        methods.reset({
          name: restaurant.name,
          cuisineType: restaurant.cuisineType,
          contactInformation: restaurant.contactInformation,
          address: {
            streetNumber: restaurant.address.streetNumber,
            streetName: restaurant.address.streetName,
            unit: restaurant.address.unit || "",
            city: restaurant.address.city,
            state: restaurant.address.state,
            postalCode: restaurant.address.postalCode,
            country: restaurant.address.country,
          },
          operatingHours: {
            monday: restaurant.operatingHours?.monday || null,
            tuesday: restaurant.operatingHours?.tuesday || null,
            wednesday: restaurant.operatingHours?.wednesday || null,
            thursday: restaurant.operatingHours?.thursday || null,
            friday: restaurant.operatingHours?.friday || null,
            saturday: restaurant.operatingHours?.saturday || null,
            sunday: restaurant.operatingHours?.sunday || null,
          },
          photos: restaurant.photos?.map((photo) => photo.url) || [],
        });
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setError("Restaurant not found");
          } else {
            setError(
              `Error fetching restaurant: ${err.response?.status}: ${err.response?.data}`,
            );
          }
        } else {
          setError("Error fetching restaurant data");
        }
      } finally {
        setLoading(false);
      }
    };

    doUseEffect();
  }, [apiService, restaurantId, methods]);

  const uploadPhoto = async (file: File, caption?: string): Promise<Photo> => {
    if (!apiService) {
      throw Error("API Service not available!");
    }
    return apiService.uploadPhoto(file, caption);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!apiService) {
        throw Error("API Service not available!");
      }

      // Convert null -> undefined
      const sanitizedOperatingHours = Object.fromEntries(
        Object.entries(data.operatingHours).map(([day, value]) => [
          day,
          value === null ? undefined : value,
        ]),
      );

      const updateRestaurantRequest: CreateRestaurantRequest = {
        name: data.name,
        cuisineType: data.cuisineType,
        contactInformation: data.contactInformation,
        address: data.address,
        operatingHours: sanitizedOperatingHours,
        photoIds: data.photos,
      };

      setError(undefined);

      if (restaurantId) {
        await apiService.updateRestaurant(
          restaurantId,
          updateRestaurantRequest,
        );
      } else {
        await apiService.createRestaurant(updateRestaurantRequest);
      }

      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          const errorData = err.response.data?.message;
          setError(errorData);
        } else {
          setError(`API Error: ${err.response?.status}: ${err.response?.data}`);
        }
      } else {
        setError(String(err));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100vh] flex items-center justify-center">
        <p>Loading 🍝</p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Update a Restaurant</h1>

      <Card>
        <CardContent className="pt-6">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <CreateRestaurantForm uploadPhoto={uploadPhoto} error={error} />
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}