"use client";

import { RadioGroup } from "@headlessui/react";
import { CheckCircleSolid } from "@medusajs/icons";
import { Cart, ShippingOption } from "@medusajs/medusa";
import { Button, Heading, Text, clx } from "@medusajs/ui";
import { formatAmount } from "@lib/util/prices";

import Divider from "@modules/common/components/divider";
import Radio from "@modules/common/components/radio";
import Spinner from "@modules/common/icons/spinner";
import ErrorMessage from "@modules/checkout/components/error-message";
import { setShippingMethod } from "@modules/checkout/actions";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type ShippingProps = {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">;
};

const Shipping: React.FC<ShippingProps> = ({ cart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isOpen = searchParams.get("step") === "delivery";

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false });
  };

  const handleSubmit = () => {
    setIsLoading(true);
    router.push(pathname + "?step=payment", { scroll: false });
  };

  const set = async (id: string, lineItemId: string) => {
    setIsLoading(true);
    await setShippingMethod(id, lineItemId)
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.toString());
        setIsLoading(false);
      });
  };

  const handleChange = (value: string, lineItemId: string) => {
    set(value, lineItemId);
  };

  useEffect(() => {
    setIsLoading(false);
    setError(null);
  }, [isOpen]);

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && cart.shipping_methods.length > 0 && <CheckCircleSolid />}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8 flex flex-col gap-6">
            {cart.items &&
              cart.items.length > 0 &&
              cart.items.map((item, index) => {
                // get available shipping methods for specific product
                const availableShippingMethods =
                  item.variant.product.shipping_options;

                return (
                  <div key={index}>
                    <p className="font-normal font-sans txt-medium text-ui-fg-base mb-4">
                      Choose shipping method for: {item.variant.product.title}
                    </p>
                    {availableShippingMethods.length > 0 ? (
                      availableShippingMethods.map((option: ShippingOption) => {
                        return (
                          <RadioGroup
                            value={cart.shipping_methods[0]?.shipping_option_id}
                            onChange={(value: string) =>
                              handleChange(value, item.id)
                            }
                          >
                            <RadioGroup.Option
                              key={option.id}
                              value={option.id}
                              data-testid="delivery-option-radio"
                              className={clx(
                                "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                                {
                                  "border-ui-border-interactive":
                                    !!cart.shipping_methods.find(
                                      (el) =>
                                        el.shipping_option.id === option.id
                                    ),
                                }
                              )}
                            >
                              <div className="flex items-center gap-x-4">
                                <Radio
                                  checked={
                                    !!cart.shipping_methods.find(
                                      (el) =>
                                        el.shipping_option.id === option.id
                                    )
                                  }
                                />
                                <span className="text-base-regular">
                                  {option.name}
                                </span>
                              </div>
                              <span className="justify-self-end text-ui-fg-base">
                                {formatAmount({
                                  amount: option.amount!,
                                  region: cart?.region,
                                  includeTaxes: false,
                                })}
                              </span>
                            </RadioGroup.Option>
                          </RadioGroup>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center px-4 py-8 text-ui-fg-base">
                        <Spinner />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={cart.shipping_methods.length !== cart.items.length}
            data-testid="submit-delivery-option-button"
          >
            Continue to payment
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_methods.length > 0 && (
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  {`Method${cart.shipping_methods.length > 1 ? "s" : ""}`}
                </Text>
                {cart.shipping_methods.map((method, index) => {
                  return (
                    <Text key={index} className="txt-medium text-ui-fg-subtle">
                      {method.shipping_option.name} (
                      {formatAmount({
                        amount: method.price,
                        region: cart.region,
                        includeTaxes: false,
                      })
                        .replace(/,/g, "")
                        .replace(/\./g, ",")}
                      )
                    </Text>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  );
};

export default Shipping;
