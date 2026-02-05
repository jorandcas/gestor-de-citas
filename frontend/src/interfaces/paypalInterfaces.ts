export interface PaypalCaptureResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  payer: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
    address: {
      country_code: string;
    };
  };
  payment_source: {
    paypal: {
      email_address: string;
      account_id: string;
      account_status: string;
      address: {
        country_code: string;
      };
      name: {
        given_name: string;
        surname: string;
      };
    };
  };
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
        create_time: string;
        final_capture: boolean;
        links: Array<{
          href: string;
          rel: string;
          method: string;
        }>;
        seller_protection: {
          status: string;
          dispute_categories: string[];
        };
        seller_receivable_breakdown: {
          gross_amount: {
            currency_code: string;
            value: string;
          };
          net_amount: {
            currency_code: string;
            value: string;
          };
          paypal_fee: {
            currency_code: string;
            value: string;
          };
          receivable_amount: {
            currency_code: string;
            value: string;
          };
          exchange_rate: {
            source_currency: string;
            target_currency: string;
            value: string;
          };
        };
        update_time: string;
        reference_id: string;
      }>;
    };
  }>;
}