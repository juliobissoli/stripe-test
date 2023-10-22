const express = require("express");
const app = express();
const { resolve } = require("path");
// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });
const cors = require("cors"); // Importe o pacote cors

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});





app.use(express.static(process.env.STATIC_DIR));

app.use(cors());

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "BRL",
      amount: 100,
      automatic_payment_methods: { enabled: true },
      // application_fee_amount: 50,
      transfer_data: {
        // destination: 'acct_1O2NMUQ1aVmMdq69',  // ID contra connectada 
        destination: 'acct_1O3gKGQ1oMafWcgg',  // ID conta normal
        amount: 50,  // Quantia a ser repassada em centavos
      },
    });

    // https://connect.stripe.com/d/setup/e/_Oq38PWgz5aVbpVpOFqTvHsL2vk/YWNjdF8xTzJOMlpQcWF2d2Izb0dl/9b85a90b778bceaa5

    console.log('pos => ', paymentIntent)
    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    console.log(e)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.put("/accept", async (req, res) => {
  try {


    const account = await stripe.accounts.update(
      'acct_1O2NMUQ1aVmMdq69',
      {
        tos_acceptance: {
          date: 1697628012,
          ip: '131.255.23.48',
        },
      })

    res.send(account);
  } catch (error) {
    console.log('error => ', error)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
})


app.post("/account", async (req, res) => {
  try {


    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      // capabilities: {
      //   card_payments: {
      //     requested: true,
      //   },
      //   transfers: {
      //     requested: true,
      //   },
      // },
    });

    if (account) {

      console.log('====== tesmo conta ====== ')
      console.log(account)
      console.log('\n\n ====== Criar link ====== ')

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'http://localhost:5173',
        return_url: 'http://localhost:5173',
        type: 'account_onboarding',
      });

      res.send(accountLink);
    }
  } catch (e) {
    console.log('error => ', e)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
})


app.put('/account-url/:id', async (req, res) => {

  try {
    console.log(req.params)

    if (req.params.id) {


      const accountLink = await stripe.accountLinks.create({
        account: req.params.id,
        refresh_url: 'http://localhost:5173',
        return_url: 'http://localhost:5173',
        type: 'account_onboarding',
      });

      return res.send({ accountLink });
    }

    return res.status(500).send({ message: 'Não tem id' })


  } catch (e) {
    console.log(e)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });

  }
})

app.get("/account-check/:id", async (req, res) => {
  try {
    if (req.params.id) {
      const account = await stripe.accounts.retrieve(req.params.id);
      console.log(account)
      res.send(account)
    }
    return res.status(500).send({ message: 'Não tem id' })
  } catch (e) {
    // return error default
    console.log(e)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
})


app.post("/transfer", async (req, res) => {

  try {

    const transfer = await stripe.transfers.create({
      currency: "BRL",
      amount: 100,
      destination: 'acct_1Ny1ksLPle8F5nu6',  // ID da conta do prestador
    });

    res.send(transfer);

  } catch (e) {
    console.log('error => ', e)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    })
  }
})


app.post("/create-payment-seccion", async (req, res) => {
  
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_1O3mjGLPle8F5nu6UG9tuTl6', // Use o price correto associado ao produto
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:5173/response-pay',
        cancel_url: 'http://localhost:5173/cancel',
        payment_intent_data: {
          application_fee_amount: 100,
          transfer_data: {
            destination: 'acct_1O3gKGQ1oMafWcgg',
          },
        },
      });
  
      // https://connect.stripe.com/d/setup/e/_Oq38PWgz5aVbpVpOFqTvHsL2vk/YWNjdF8xTzJOMlpQcWF2d2Izb0dl/9b85a90b778bceaa5
  
      console.log('pos => ', session)
      // Send publishable key and PaymentIntent details to client
      res.send(session);
    } catch (e) {
      console.log(e)
      return res.status(400).send({
        error: {
          message: e.message,
        },
      });
    }
})


// router to cerate product in stripe
app.post("/create-product", async (req, res) => {

  try {
    const product = await stripe.products.create({
      name: 'Teste criação api',
      default_price_data: {
        unit_amount: 300,
        currency: 'BRL',
      },
    });

    res.send(product);

  } catch (e) {
    console.log('error => ', e)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    })
  }
})


//  router to lista producrts
app.get("/list-products", async (req, res) => {

  try {
    const products = await stripe.products.list({
      limit: 3,
    });

    res.send(products);

  } catch (e) {
    console.log('error => ', e)
    return res.status(400).send({
      error: {
        message: e.message,
      },
    })
  }
})

app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);