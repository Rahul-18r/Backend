import { Cashfree, CFEnvironment } from 'cashfree-pg';

// Create an order
export const createOrder = async (phone, registrations, usn, name, decodedCollege, email) => {
    try {
        let amount;

        const eventLength = registrations.length;

        const eventPricing = {
            1: 100,
            2: 160,
            3: 220,
            4: 250
        };
        
        if (eventLength in eventPricing) {
            amount = eventPricing[eventLength];
        } else {
            console.log("You can't have more than 4 events");
        }
        
        const orderId = `FEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const request = {
            order_amount: amount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: `CUST-${Date.now()}`,
                customer_phone: phone,
                customer_email: email,
                customer_name: name,
            },
            order_meta: {
                return_url: `${process.env.FRONTEND_URL}/success?order_id={order_id}`,
                notify_url: `${process.env.BACKEND_URL}/api/webhook/cashfree`,
            },
            order_note: orderId,
        };

        const cashfree = new Cashfree(
            process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
            process.env.CASHFREE_APP_ID,
            process.env.CASHFREE_SECRET_KEY
        );

        const response = await cashfree.PGCreateOrder(request);

        console.log("Cashfree order created:", response.data);
        return response.data;


    } catch (error) {
        console.error("Error creating Cashfree order:", error);
        throw new Error("Could not create Cashfree order");
    }
};

// Verify payment
export const verifyPayment = async (order_id) => {
    try {
        const cashfree = new Cashfree(
            process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
            process.env.CASHFREE_APP_ID,
            process.env.CASHFREE_SECRET_KEY
        );

        const response = await cashfree.PGFetchOrder(order_id);
        return response.data.order_status === 'PAID';
    } catch (error) {
        console.error("Error verifying payment:", error);
        throw new Error("Payment verification failed");
    }
};
