import { domain } from "./dns";

sst.Linkable.wrap(stripe.WebhookEndpoint, (endpoint) => {
	return {
		properties: {
			id: endpoint.id,
			secret: endpoint.secret,
		},
	};
});

export const stripeWebhook = new stripe.WebhookEndpoint(
	"StripeWebhook",
	{
		url: $interpolate`${domain}/hook/stripe`,
		metadata: {
			stage: $app.stage,
		},
		enabledEvents: [
			"payment_method.attached",
			"payment_method.detached",
			"payment_method.updated",
			"product.created",
			"product.updated",
			"product.deleted",
			"price.created",
			"price.updated",
			"price.deleted",
		],
	},
	{},
);