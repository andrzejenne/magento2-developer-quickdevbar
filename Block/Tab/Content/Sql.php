<?php

namespace ADM\QuickDevBar\Block\Tab\Content;

use Magento\Framework\App\ResourceConnection;
use Magento\Framework\View\Element\Template\Context;

class Sql extends \ADM\QuickDevBar\Block\Tab\Panel
{
    protected $_resource;

    public function __construct(
        Context $context,
        ResourceConnection $resource,
        array $data = []
    ) {
        $this->_resource = $resource;

        parent::__construct($context, $data);
    }

    public function hasProfiler()
    {
        return $this->_resource->getConnection()->getProfiler() instanceof \Zend_Db_Profiler;
    }
}
