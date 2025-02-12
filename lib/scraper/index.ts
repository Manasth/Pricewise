"use server"

import axios from "axios";
import * as cheerio from "cheerio";
import { extractPrice, extractCurrency, extractCategory, extractReviewsCount, extractStars, extractDescription } from "../utils";

export async function scrapeAmazonProduct(url:string) {
    if(!url) return;

    // Bright data proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSOWRD);

    // curl -i --proxy brd.superproxy.io:33335 
    // --proxy-user brd-customer-hl_bd98f5fc-zone-pricewise:fvlt930q4vwy -k 
    // "https://geo.brdtest.com/welcome.txt?product=unlocker&method=native"

    const port = 33335;
    const session_id = (1000000 * Math.random()) | 0;
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
          },
          host: 'brd.superproxy.io',
          port,
          rejectUnauthorized: false,
    }

    try {
        // Fetch the product page
        const response = await axios.get(url, options);
        const $ = cheerio.load(response.data);

        const title = $("#productTitle").text().trim();

        const currentPrice = extractPrice(
            $(`span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay > span[aria-hidden="true"] > span.a-price-whole:first`),
            // $('.priceToPay span.a-price-whole'),
            // $('.a.size.base.a-color-price'),
            // $('.a-button-selected .a-color-base'),
        );

        const originalPrice = extractPrice(
            $("span.a-size-small.a-color-secondary.aok-align-center.basisPrice > span.a-price.a-text-price > span.a-offscreen:first")
            // $('#priceblock_ourprice'),
            // $('.a-price.a-text-price span.a-offscreen'),
            // $('#listPrice'),
            // $('#priceblock_dealprice'),
            // $('.a-size-base.a-color-price')
        );

        const outOfStock = $("#availability > span.a-declarative > span.a-size-medium.a-color-success").text().trim() === "Currently unavailable.";

        const images = 
        $("#imgBlkFront").attr("data-a-dynamic-image") ||
        $("#landingImage").attr("data-a-dynamic-image") ||
        "{}";

        const imageUrls = Object.keys(JSON.parse(images));

        const currency = extractCurrency($(".a-price-symbol"));
        const discountRate = $(`.savingsPercentage:first`).text().replace(/[-%]/g, "");

        const category = extractCategory($("#nav-subnav > .nav-a.nav-b > .nav-a-content"))
        const reviewsCount = extractReviewsCount($("#acrCustomerReviewText"));
        const stars = extractStars($("#averageCustomerReviews > span > span > span > a > span:first"));

        const description = extractDescription($)

        const data = {
            url,
            currency: currency || "$",
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice),
            originalPrice: Number(originalPrice),
            priceHistory: [],
            discountRate: Number(discountRate),
            category,
            reviewsCount: Number(reviewsCount),
            stars: Number(stars),
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }

        console.log(data);
        
        return data;
    } catch (error: any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }
}