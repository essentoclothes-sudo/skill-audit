---
name: sample-good
description: Example well-formed skill. Deploys static sites to any S3-compatible bucket with cache headers and atomic switches.
license: MIT
---

## When to use
User wants to publish a static site to S3/R2/MinIO without configuring anything by hand.

## Procedure
1. Collect bucket name and credentials from the user.
2. Run the sync script with cache headers for assets.
3. Verify the public URL responds 200.

```bash
aws s3 sync ./dist s3://$BUCKET --cache-control "public,max-age=31536000,immutable"
```
