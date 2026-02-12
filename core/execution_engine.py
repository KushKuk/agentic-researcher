class ExecutionEngine:

    def execute(self, plan, state, pipeline_map):

        for step in plan:

            if step not in pipeline_map:
                state.log_error(f"Unknown step: {step}")
                continue

            try:
                state.log_reasoning(f"Executing step: {step}")

                result = pipeline_map[step](state.topic)

                state.add_result(step, result)
                state.add_step(step)

            except Exception as e:
                state.log_error(str(e))

        return state
