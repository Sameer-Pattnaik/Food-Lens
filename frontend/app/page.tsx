"use client";

import RestaurantSearch from "@/components/restaurant-search";
import RestaurantList from "@/components/restaurant-list";
import Hero from "@/components/hero";
import { useEffect, useState, useCallback } from "react";
import { RestaurantSearchParams, RestaurantSummary } from "@/domain/domain";
import { useAppContext } from "@/providers/app-context-provider";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Home() {
  const { apiService } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [first, setFirst] = useState<boolean>(true);
  const [last, setLast] = useState<boolean>(false);
  const [currentSearchParams, setCurrentSearchParams] =
    useState<RestaurantSearchParams>({});

  const searchRestaurants = useCallback(
    async (params: RestaurantSearchParams, targetPage?: number) => {
      try {
        if (!apiService) return;

        setLoading(true);

        const pageToUse = targetPage ?? page;

        const paginatedParams = {
          ...params,
          page: pageToUse,
          size: 8,
        };

        const response = await apiService.searchRestaurants(paginatedParams);

        if (response) {
          setTotalPages(response.totalPages);
          setFirst(response.first);
          setLast(response.last);
          setRestaurants(response.content);
          setCurrentSearchParams(params);
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    },
    [apiService, page]
  );

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    await searchRestaurants(currentSearchParams, newPage);
  };

  const getPageNumbers = () => {
    if (!totalPages) return [];

    const pageNumbers: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pageNumbers.push(1);

    if (page > 3) {
      pageNumbers.push("ellipsis");
    }

    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pageNumbers.push(i);
    }

    if (page < totalPages - 2) {
      pageNumbers.push("ellipsis");
    }

    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  useEffect(() => {
    if (!apiService) return;

    searchRestaurants({});
  }, [apiService, searchRestaurants]);

  return (
    <div>
      <Hero />

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <RestaurantSearch searchRestaurants={searchRestaurants} />

        <RestaurantList loading={loading} restaurants={restaurants} />

        {totalPages && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {!first && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page - 1);
                      }}
                    />
                  </PaginationItem>
                )}

                {getPageNumbers().map((pageNum, index) => (
                  <PaginationItem key={`page-${pageNum}-${index}`}>
                    {pageNum === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={pageNum === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum as number);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                {!last && (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page + 1);
                      }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
}