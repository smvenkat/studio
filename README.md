# LoadCraft K6

LoadCraft K6 is a web-based application designed to streamline performance testing by leveraging generative AI. It allows users to upload an API specification (Swagger/OpenAPI), receive an AI-generated test plan, customize it, and generate a ready-to-use k6 performance test script.

## Application Flow

The application guides the user through a four-step process:

### 1. Analyze API
- **Input:** The user provides a Swagger or OpenAPI specification for their API by pasting the JSON or YAML content into a text area.
- **Process:** A Genkit AI flow analyzes the API definition to understand its endpoints, methods, and structure.

### 2. Create Plan
- **Process:** Based on the analysis, the AI suggests a comprehensive performance test plan. This plan includes various relevant test types (e.g., Load Test, Stress Test, Spike Test) along with appropriate Service Level Indicator (SLI) and Service Level Objective (SLO) metrics for each.
- **Customization:** The user can review the AI-suggested plan and customize it. They can select a global test type, modify the description, and fine-tune the SLI/SLO metric thresholds using interactive sliders.

### 3. Generate Script
- **Process:** Once the user is satisfied with the test plan, another Genkit AI flow generates a k6 test script. This script is tailored to the API specification and incorporates the customized test plan, including the selected test type and metrics.
- **Configuration:** The user can configure additional test parameters, such as the number of Virtual Users (VUs) and the test duration.

### 4. Execute & Report
- **Simulation:** This step provides a visual simulation of a test run within the browser. It displays real-time charts for key metrics like Virtual Users, response time (p95), requests per second, and error rate. **Note: This stage does not make real API calls to the target endpoints.**
- **Artifacts:**
    - The fully functional `k6-script.js` can be downloaded to be executed locally using the k6 command-line tool. Running this script will perform real performance tests against the API.
    - An archive (`.zip`) file containing the k6 script and a JSON file of the simulated test report can also be downloaded.

## Technology Stack
- **Framework:** Next.js (React)
- **Generative AI:** Google Gemini Pro via Genkit
- **UI Components:** ShadCN UI
- **Styling:** Tailwind CSS
- **Performance Testing Script:** k6
