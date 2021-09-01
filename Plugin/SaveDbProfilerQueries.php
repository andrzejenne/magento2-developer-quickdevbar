<?php
declare(strict_types=1);

namespace ADM\QuickDevBar\Plugin;

use ADM\QuickDevBar\Helper\Data;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\AppInterface;

/**
 * AppInterface launch interceptor
 */
class SaveDbProfilerQueries
{
    /**
     * @var ResourceConnection
     */
    private $resourceConnection;
    /**
     * @var Data
     */
    private $data;

    /**
     * @param ResourceConnection $resourceConnection
     * @param Data               $data
     */
    public function __construct(ResourceConnection $resourceConnection, Data $data)
    {
        $this->resourceConnection = $resourceConnection;
        $this->data = $data;
    }

    /**
     * @param AppInterface $subject
     * @param callable     $proceed
     * @return mixed
     * @throws \Exception
     */
    public function aroundLaunch(AppInterface $subject, callable $proceed) {
        try {
            $response = $proceed();
        } catch (\Exception $exception) {
            $error = $exception;
        } finally {
            $this->saveQueries();
        }

        if (isset($response)) {
            return $response;
        } else {
            if (isset($error)) {
                throw $error;
            }
        }

        throw new \Exception("Unexpected result ;)");
    }

    /** @todo storage with own interface (file, db) */
    private function saveQueries()
    {
        if (!$this->data->isToolbarAccessAllowed() || $this->isDevBarRequest()) {
            return;
        }

        $profiler = $this->resourceConnection->getConnection()->getProfiler();
        /** @var \Zend_Db_Profiler_Query[] $queryProfiles */
        $queryProfiles = $profiler->getQueryProfiles();
        if (is_array($queryProfiles)) {
            $head = [
                'request' => $_SERVER['REQUEST_URI'],
                'datetime' => date(\DateTimeInterface::ATOM),
            ];
            $data = [
                'server' => [
                    'args' => $_SERVER,
                    'post' => $_POST,
                    'query' => $_GET,
                    'session' => $_SESSION,
                    'cookie' => $_COOKIE,
                ],
                'stats' => [
                    'numberOfQueries' => [
                        'total' => $profiler->getTotalNumQueries(),
                        'select' => $profiler->getTotalNumQueries(\Zend_Db_Profiler::SELECT),
                        'insert' => $profiler->getTotalNumQueries(\Zend_Db_Profiler::INSERT),
                        'update' => $profiler->getTotalNumQueries(\Zend_Db_Profiler::UPDATE),
                        'delete' => $profiler->getTotalNumQueries(\Zend_Db_Profiler::DELETE),
                        'transaction' => $profiler->getTotalNumQueries(\Zend_Db_Profiler::TRANSACTION),
                    ],
                ],
                'list' => [ ]
            ];

            foreach ($queryProfiles as $queryProfile) {
                $args = $queryProfile->getQueryParams();
                ksort($args);
                $data['list'][] = [
                    'query' => $queryProfile->getQuery(),
                    'params' => $args,
                    'type' => $queryProfile->getQueryType(),
                    'started' => $queryProfile->getStartedMicrotime(),
                    'elapsed' => $queryProfile->getElapsedSecs(),
                ];
            }

            $name = time();

            file_put_contents('/tmp/' . $name . '.data.json', \json_encode($data));
            file_put_contents('/tmp/' . $name . '.head.json', \json_encode($head));
        }
    }

    private function isDevBarRequest(): bool
    {
        return strpos($_SERVER['REQUEST_URI'], '/quickdevbar') === 0;
    }

}
