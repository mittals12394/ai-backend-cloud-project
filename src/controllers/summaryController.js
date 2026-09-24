const summaryService =
    require('../services/summaryService');

const triggerSummary =
    async (
        req,
        res,
        next
    ) => {

        try {

            const result =
                await summaryService
                    .requestSummary(

                        req.validatedParams.id,

                        req.user.userId
                    );

            res.status(202).json({

                success: true,

                message:
                    'Summary queued',

                data: result
            });

        } catch (err) {

            next(err);
        }
    };

const getSummary =
    async (
        req,
        res,
        next
    ) => {

        try {

            const result =
                await summaryService
                    .getSummary(

                        req.validatedParams.issueId
                    );

            res.status(200).json({

                success: true,

                data: result
            });

        } catch (err) {

            next(err);
        }
    };

module.exports = {
    triggerSummary,
    getSummary
};